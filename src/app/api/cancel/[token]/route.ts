import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const booking = await prisma.booking.findUnique({
      where: { cancelToken: token },
      include: {
        contractor: {
          select: { businessName: true },
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
    if (hoursBefore < 24) {
      return NextResponse.json({ error: "Cancellation is no longer available. The appointment is less than 24 hours away." }, { status: 400 });
    }

    if (!["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ error: "This booking cannot be cancelled." }, { status: 400 });
    }

    return NextResponse.json({
      bookingId: booking.id,
      customerName: booking.customerName,
      businessName: booking.contractor.businessName,
      appointmentStart: booking.appointmentStart,
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
      where: { cancelToken: token },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.tokenExpiresAt && new Date() > booking.tokenExpiresAt) {
      return NextResponse.json({ error: "This link has expired." }, { status: 410 });
    }

    const hoursBefore = (booking.appointmentStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursBefore < 24) {
      return NextResponse.json({ error: "Cancellation is no longer available." }, { status: 400 });
    }

    if (!["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ error: "This booking cannot be cancelled." }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        holdExpiresAt: null,
      },
    });

    const dateStr = booking.appointmentStart.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const timeStr = booking.appointmentStart.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });

    await createNotification(
      booking.contractorId,
      "cancel",
      `${booking.customerName} cancelled`,
      `${booking.customerName} cancelled their booking for ${dateStr} at ${timeStr}.`,
      booking.id
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
