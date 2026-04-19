import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/messaging";
import { cancelExecution } from "@/lib/n8n";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName, customerPhone, additionalPhone, jobDescription,
      quoteAmount, durationMinutes, appointmentStart,
      locationType, locationAddress, locationLat, locationLng, locationMapUrl,
      notes, quoteId,
    } = body;

    if (!customerName || !customerPhone || !jobDescription || !quoteAmount || !appointmentStart || !locationType) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }

    const duration = typeof durationMinutes === "number" && durationMinutes >= 15 && durationMinutes <= 480
      ? durationMinutes : 60;

    const slotStart = new Date(appointmentStart);
    if (isNaN(slotStart.getTime())) {
      return NextResponse.json({ error: "Invalid appointment time." }, { status: 400 });
    }
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // Check slot availability
    const conflict = await prisma.booking.findFirst({
      where: {
        contractorId: session.user.id,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        appointmentStart: { lt: slotEnd },
        appointmentEnd: { gt: slotStart },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "This time slot is already booked." }, { status: 409 });
    }

    const now = new Date();

    // Create quote + booking in transaction
    const { booking } = await prisma.$transaction(async (tx) => {
      // Double check
      const conflict2 = await tx.booking.findFirst({
        where: {
          contractorId: session.user.id,
          status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
          appointmentStart: { lt: slotEnd },
          appointmentEnd: { gt: slotStart },
        },
      });
      if (conflict2) throw new Error("SLOT_TAKEN");

      let linkedQuoteId: string;

      if (quoteId) {
        // Link to existing quote
        const existing = await tx.quote.findUnique({ where: { id: quoteId } });
        if (!existing || existing.contractorId !== session.user.id) throw new Error("QUOTE_NOT_FOUND");
        await tx.quote.update({
          where: { id: quoteId },
          data: { formSubmittedAt: now },
        });
        linkedQuoteId = quoteId;
      } else {
        // Create new quote
        const quote = await tx.quote.create({
          data: {
            customerName,
            customerPhone,
            jobDescription,
            quoteAmount: amount,
            durationMinutes: duration,
            formSubmittedAt: now,
            contractorId: session.user.id,
          },
        });
        linkedQuoteId = quote.id;
      }

      const booking = await tx.booking.create({
        data: {
          quoteId: linkedQuoteId,
          contractorId: session.user.id,
          customerName,
          customerPhone,
          additionalPhone: additionalPhone?.trim() || null,
          jobDescription,
          quoteAmount: amount,
          durationMinutes: duration,
          appointmentStart: slotStart,
          appointmentEnd: slotEnd,
          locationType,
          locationAddress: locationAddress || null,
          locationLat: locationLat || null,
          locationLng: locationLng || null,
          locationMapUrl: locationMapUrl || null,
          notes: notes?.trim() || null,
          status: "CONFIRMED",
          confirmedAt: now,
          isManualBooking: true,
          rescheduleToken: crypto.randomUUID(),
          cancelToken: crypto.randomUUID(),
          tokenExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return { booking };
    });

    // Mark linked quote as WON if booking was created from a quote
    if (quoteId) {
      const linkedQuote = await prisma.quote.findUnique({ where: { id: quoteId } });
      if (linkedQuote) {
        await prisma.quote.update({
          where: { id: quoteId },
          data: { status: "WON", followUpCancelled: true, n8nExecutionId: null },
        });
        if (linkedQuote.n8nExecutionId) {
          try { await cancelExecution(linkedQuote.n8nExecutionId); } catch { /* ignore */ }
        }
      }
    }

    // Send confirmation to customer
    const contractor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessName: true },
    });
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const slotDateStr = slotStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const slotTimeStr = slotStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    const confirmMsg = `Your booking with ${contractor?.businessName || "your contractor"} is confirmed!\n\n` +
      `Date: ${slotDateStr} at ${slotTimeStr}\n` +
      `Job: ${jobDescription}\n` +
      `Amount: $${amount}\n\n` +
      `Need to reschedule? ${baseUrl}/reschedule/${booking.rescheduleToken}\n` +
      `Need to cancel? ${baseUrl}/cancel/${booking.cancelToken}`;
    await sendMessage(customerPhone, confirmMsg);

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "This time slot was just taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
