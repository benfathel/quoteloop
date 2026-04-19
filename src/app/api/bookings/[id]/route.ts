import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendMessage } from "@/lib/messaging";
import { cancelExecution } from "@/lib/n8n";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        quote: {
          select: { id: true, formToken: true, quoteAmount: true },
        },
      },
    });

    if (!booking || booking.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        contractor: {
          select: { businessName: true, name: true },
        },
        quote: {
          select: { id: true, n8nExecutionId: true },
        },
      },
    });

    if (!booking || booking.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body; // "confirm" | "decline" | "complete"

    if (!action || !["confirm", "decline", "complete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const slotDateStr = booking.appointmentStart.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const slotTimeStr = booking.appointmentStart.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    if (action === "confirm") {
      if (booking.status !== "PENDING_CONFIRMATION") {
        return NextResponse.json({ error: "Booking is not pending confirmation." }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          holdExpiresAt: null,
        },
      });

      // Mark quote as WON and cancel pending follow-ups
      if (booking.quoteId) {
        await prisma.quote.update({
          where: { id: booking.quoteId },
          data: { status: "WON", followUpCancelled: true },
        });
        if (booking.quote?.n8nExecutionId) {
          try { await cancelExecution(booking.quote.n8nExecutionId); } catch { /* ignore */ }
        }
      }

      // Send confirmation to customer
      const confirmMsg = `Your booking with ${booking.contractor.businessName} is confirmed!\n\n` +
        `Date: ${slotDateStr} at ${slotTimeStr}\n` +
        `Job: ${booking.jobDescription}\n` +
        `Amount: $${booking.quoteAmount}\n\n` +
        `Need to reschedule? ${baseUrl}/reschedule/${booking.rescheduleToken}\n` +
        `Need to cancel? ${baseUrl}/cancel/${booking.cancelToken}`;
      await sendMessage(booking.customerPhone, confirmMsg);

      return NextResponse.json(updated);
    }

    if (action === "decline") {
      if (booking.status !== "PENDING_CONFIRMATION") {
        return NextResponse.json({ error: "Booking is not pending confirmation." }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: "DECLINED",
          declinedAt: new Date(),
          holdExpiresAt: null,
        },
      });

      // Notify customer
      const declineMsg = `Unfortunately, ${booking.contractor.name} from ${booking.contractor.businessName} is unable to confirm your appointment for ${slotDateStr} at ${slotTimeStr}. Please contact them directly to arrange an alternative.`;
      await sendMessage(booking.customerPhone, declineMsg);

      await createNotification(
        session.user.id,
        "decline",
        "Booking declined",
        `You declined ${booking.customerName}'s booking for ${slotDateStr}.`,
        booking.id
      );

      return NextResponse.json(updated);
    }

    if (action === "complete") {
      if (booking.status !== "CONFIRMED") {
        return NextResponse.json({ error: "Only confirmed bookings can be completed." }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      // Mark the related quote as WON
      if (booking.quoteId) {
        await prisma.quote.update({
          where: { id: booking.quoteId },
          data: { status: "WON" },
        });
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        quote: { select: { id: true, n8nExecutionId: true } },
      },
    });

    if (!booking || booking.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Delete associated notifications first
    await prisma.notification.deleteMany({ where: { bookingId: id } });

    // Delete the booking
    await prisma.booking.delete({ where: { id } });

    // If there's a linked quote, unlink the booking and cancel any n8n execution
    if (booking.quoteId) {
      await prisma.quote.update({
        where: { id: booking.quoteId },
        data: { formSubmittedAt: null },
      });
      if (booking.quote?.n8nExecutionId) {
        try { await cancelExecution(booking.quote.n8nExecutionId); } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
