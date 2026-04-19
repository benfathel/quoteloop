import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find CONFIRMED bookings with appointmentStart between 24-48h from now
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        appointmentStart: {
          gte: in24h,
          lte: in48h,
        },
      },
    });

    let reminded = 0;
    for (const booking of upcomingBookings) {
      // Check if we already sent a reminder for this booking
      const existing = await prisma.notification.findFirst({
        where: {
          bookingId: booking.id,
          type: "reminder_24h",
        },
      });

      if (existing) continue;

      const dateStr = booking.appointmentStart.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      const timeStr = booking.appointmentStart.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      });

      await createNotification(
        booking.contractorId,
        "reminder_24h",
        "Appointment tomorrow",
        `Reminder: You have a booking with ${booking.customerName} tomorrow at ${timeStr} (${dateStr}).`,
        booking.id
      );

      reminded++;
    }

    console.log(`Sent ${reminded} appointment reminders`);
    return NextResponse.json({ reminded });
  } catch (error) {
    console.error("Error sending appointment reminders:", error);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
