import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Find bookings where hold is expiring within 2 hours and reminder not yet sent
    const expiringBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING_CONFIRMATION",
        holdExpiresAt: { lte: twoHoursFromNow },
        holdReminderSent: false,
      },
    });

    let reminded = 0;
    for (const booking of expiringBookings) {
      const dateStr = booking.appointmentStart.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      const timeStr = booking.appointmentStart.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      });

      await createNotification(
        booking.contractorId,
        "hold_expiring",
        "Booking request expiring soon",
        `Reminder: ${booking.customerName}'s booking request for ${dateStr} at ${timeStr} is waiting for your response. Please confirm or decline.`,
        booking.id
      );

      await prisma.booking.update({
        where: { id: booking.id },
        data: { holdReminderSent: true },
      });

      reminded++;
    }

    console.log(`Sent ${reminded} hold expiry reminders`);
    return NextResponse.json({ reminded });
  } catch (error) {
    console.error("Error sending hold reminders:", error);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
