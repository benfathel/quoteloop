import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendMessage } from "@/lib/messaging";
import { cancelExecution } from "@/lib/n8n";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const quote = await prisma.quote.findUnique({
      where: { formToken: token },
      include: {
        contractor: {
          select: { id: true, businessName: true, name: true, autoConfirmBookings: true, subscriptionStatus: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    // Check if contractor is on Plus plan (intake forms are Plus only)
    if (quote.contractor.subscriptionStatus !== "PLUS") {
      return NextResponse.json({ error: "This feature is not available. Please contact your contractor directly." }, { status: 403 });
    }

    // Check if form was already submitted
    if (quote.formSubmittedAt) {
      return NextResponse.json({ error: "This form has already been submitted." }, { status: 400 });
    }

    // Check if link expired (expiresAt or 30 days from creation)
    const maxExpiry = new Date(quote.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDate = quote.expiresAt && quote.expiresAt < maxExpiry ? quote.expiresAt : maxExpiry;
    if (new Date() > expiryDate) {
      return NextResponse.json({ error: "This link has expired. Please contact your contractor directly." }, { status: 410 });
    }

    return NextResponse.json({
      businessName: quote.contractor.businessName,
      contractorName: quote.contractor.name,
      contractorId: quote.contractor.id,
      customerPhone: quote.customerPhone,
      customerName: quote.customerName,
      jobDescription: quote.jobDescription,
      quoteAmount: quote.quoteAmount,
      durationMinutes: quote.durationMinutes,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const quote = await prisma.quote.findUnique({
      where: { formToken: token },
      include: {
        contractor: {
          select: { id: true, businessName: true, name: true, autoConfirmBookings: true, subscriptionStatus: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.formSubmittedAt) {
      return NextResponse.json({ error: "This form has already been submitted." }, { status: 400 });
    }

    // Check expiry
    const maxExpiry = new Date(quote.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDate = quote.expiresAt && quote.expiresAt < maxExpiry ? quote.expiresAt : maxExpiry;
    if (new Date() > expiryDate) {
      return NextResponse.json({ error: "This link has expired. Please contact your contractor directly." }, { status: 410 });
    }

    // Free plan check - bookings are Plus only
    if (quote.contractor.subscriptionStatus === "FREE") {
      return NextResponse.json({ error: "Booking is not available. Please contact the contractor directly." }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      additionalPhone,
      jobDescription,
      notes,
      appointmentStart,
      locationType,
      locationAddress,
      locationLat,
      locationLng,
      locationMapUrl,
    } = body;

    if (!customerName || !customerPhone || !jobDescription || !appointmentStart || !locationType) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const slotStart = new Date(appointmentStart);
    if (isNaN(slotStart.getTime()) || slotStart <= new Date()) {
      return NextResponse.json({ error: "Please select a valid future time slot." }, { status: 400 });
    }

    const slotEnd = new Date(slotStart.getTime() + quote.durationMinutes * 60000);

    // Race condition check: ensure slot is still available
    const conflicting = await prisma.booking.findFirst({
      where: {
        contractorId: quote.contractorId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        appointmentStart: { lt: slotEnd },
        appointmentEnd: { gt: slotStart },
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: "This time slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }

    const autoConfirm = quote.contractor.autoConfirmBookings;
    const now = new Date();

    // Create booking in a transaction
    const { booking } = await prisma.$transaction(async (tx) => {
      // Double-check slot availability inside transaction
      const conflict = await tx.booking.findFirst({
        where: {
          contractorId: quote.contractorId,
          status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
          appointmentStart: { lt: slotEnd },
          appointmentEnd: { gt: slotStart },
        },
      });

      if (conflict) {
        throw new Error("SLOT_TAKEN");
      }

      const booking = await tx.booking.create({
        data: {
          quoteId: quote.id,
          contractorId: quote.contractorId,
          customerName,
          customerPhone,
          additionalPhone: additionalPhone?.trim() || null,
          jobDescription,
          quoteAmount: quote.quoteAmount,
          durationMinutes: quote.durationMinutes,
          appointmentStart: slotStart,
          appointmentEnd: slotEnd,
          locationType,
          locationAddress: locationAddress || null,
          locationLat: locationLat || null,
          locationLng: locationLng || null,
          locationMapUrl: locationMapUrl || null,
          notes: notes?.trim() || null,
          status: autoConfirm ? "CONFIRMED" : "PENDING_CONFIRMATION",
          confirmedAt: autoConfirm ? now : null,
          holdExpiresAt: autoConfirm ? null : new Date(now.getTime() + 24 * 60 * 60 * 1000),
          rescheduleToken: crypto.randomUUID(),
          cancelToken: crypto.randomUUID(),
          tokenExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Update quote with form submission data
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          formSubmittedAt: now,
          customerName,
          customerPhone,
          jobDescription,
        },
      });

      return { booking };
    });

    // Create notification for contractor
    const slotDateStr = slotStart.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const slotTimeStr = slotStart.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    // Mark quote as WON and cancel pending follow-ups (booking was created)
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "WON", followUpCancelled: true, n8nExecutionId: null },
    });
    if (quote.n8nExecutionId) {
      try { await cancelExecution(quote.n8nExecutionId); } catch { /* ignore */ }
    }

    if (autoConfirm) {
      await createNotification(
        quote.contractorId,
        "auto_confirmed",
        "Booking auto-confirmed",
        `${customerName} has booked for ${slotDateStr} at ${slotTimeStr}. Automatically confirmed.`,
        booking.id
      );

      // Send confirmation to customer
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const confirmMsg = `Your booking with ${quote.contractor.businessName} is confirmed!\n\n` +
        `Date: ${slotDateStr} at ${slotTimeStr}\n` +
        `Job: ${jobDescription}\n` +
        `Amount: $${quote.quoteAmount}\n\n` +
        `Need to reschedule? ${baseUrl}/reschedule/${booking.rescheduleToken}\n` +
        `Need to cancel? ${baseUrl}/cancel/${booking.cancelToken}`;
      await sendMessage(customerPhone, confirmMsg);
    } else {
      await createNotification(
        quote.contractorId,
        "booking_request",
        "New booking request",
        `${customerName} has requested a booking for ${slotDateStr} at ${slotTimeStr}. Tap to review.`,
        booking.id
      );
    }

    return NextResponse.json({
      success: true,
      status: booking.status,
      bookingId: booking.id,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "This time slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    console.error("Form submission error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
