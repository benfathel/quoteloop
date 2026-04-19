import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendMessage } from "@/lib/messaging";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await prisma.booking.findUnique({
      where: { rescheduleToken: token },
      include: {
        contractor: {
          select: { id: true, businessName: true, name: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Check token expiry
    if (booking.tokenExpiresAt && new Date() > booking.tokenExpiresAt) {
      return NextResponse.json({ error: "This link has expired." }, { status: 410 });
    }

    // Check 48h before appointment
    const hoursBefore = (booking.appointmentStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursBefore < 48) {
      return NextResponse.json({ error: "Rescheduling is no longer available. The appointment is less than 48 hours away." }, { status: 400 });
    }

    if (!["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ error: "This booking cannot be rescheduled." }, { status: 400 });
    }

    return NextResponse.json({
      bookingId: booking.id,
      customerName: booking.customerName,
      businessName: booking.contractor.businessName,
      contractorId: booking.contractor.id,
      durationMinutes: booking.durationMinutes,
      currentAppointment: booking.appointmentStart,
      jobDescription: booking.jobDescription,
      quoteAmount: booking.quoteAmount,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await prisma.booking.findUnique({
      where: { rescheduleToken: token },
      include: {
        contractor: {
          select: { id: true, businessName: true, name: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.tokenExpiresAt && new Date() > booking.tokenExpiresAt) {
      return NextResponse.json({ error: "This link has expired." }, { status: 410 });
    }

    const hoursBefore = (booking.appointmentStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursBefore < 48) {
      return NextResponse.json({ error: "Rescheduling is no longer available." }, { status: 400 });
    }

    if (!["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ error: "This booking cannot be rescheduled." }, { status: 400 });
    }

    const body = await request.json();
    const { appointmentStart } = body;

    const newStart = new Date(appointmentStart);
    if (isNaN(newStart.getTime()) || newStart <= new Date()) {
      return NextResponse.json({ error: "Please select a valid future time." }, { status: 400 });
    }

    const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60000);

    // Check slot availability (exclude current booking)
    const conflict = await prisma.booking.findFirst({
      where: {
        contractorId: booking.contractorId,
        id: { not: booking.id },
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        appointmentStart: { lt: newEnd },
        appointmentEnd: { gt: newStart },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "This time slot is no longer available." }, { status: 409 });
    }

    // If original was CONFIRMED, auto-confirm the reschedule (per founder decision)
    const wasConfirmed = booking.status === "CONFIRMED";
    const newStatus = wasConfirmed ? "CONFIRMED" : "PENDING_CONFIRMATION";

    const now = new Date();
    const newRescheduleToken = crypto.randomUUID();
    const newCancelToken = crypto.randomUUID();

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        appointmentStart: newStart,
        appointmentEnd: newEnd,
        status: newStatus,
        confirmedAt: wasConfirmed ? now : booking.confirmedAt,
        holdExpiresAt: wasConfirmed ? null : new Date(now.getTime() + 24 * 60 * 60 * 1000),
        holdReminderSent: false,
        rescheduleToken: newRescheduleToken,
        cancelToken: newCancelToken,
        tokenExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const oldDateStr = booking.appointmentStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const oldTimeStr = booking.appointmentStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const newDateStr = newStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const newTimeStr = newStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    // Notify contractor
    await createNotification(
      booking.contractorId,
      "reschedule",
      `${booking.customerName} rescheduled`,
      `${booking.customerName} rescheduled from ${oldDateStr} at ${oldTimeStr} to ${newDateStr} at ${newTimeStr}.${wasConfirmed ? " Auto-confirmed." : " Pending your confirmation."}`,
      booking.id
    );

    // Send updated confirmation to customer
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const msg = wasConfirmed
      ? `Your booking with ${booking.contractor.businessName} has been rescheduled and confirmed!\n\nNew date: ${newDateStr} at ${newTimeStr}\n\nNeed to reschedule again? ${baseUrl}/reschedule/${newRescheduleToken}\nNeed to cancel? ${baseUrl}/cancel/${newCancelToken}`
      : `Your rescheduled booking with ${booking.contractor.businessName} is pending confirmation.\n\nRequested: ${newDateStr} at ${newTimeStr}\n\nThe contractor will review and confirm your new time.`;
    await sendMessage(booking.customerPhone, msg);

    return NextResponse.json({ success: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
