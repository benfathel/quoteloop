import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const [schedules, user] = await Promise.all([
      prisma.weeklySchedule.findMany({
        where: { contractorId: session.user.id },
        orderBy: { dayOfWeek: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          jobDurationMinutes: true,
          bufferMinutes: true,
          autoConfirmBookings: true,
        },
      }),
    ]);

    return NextResponse.json({
      schedules,
      jobDurationMinutes: user?.jobDurationMinutes ?? 60,
      bufferMinutes: user?.bufferMinutes ?? 0,
      autoConfirmBookings: user?.autoConfirmBookings ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

interface ScheduleDay {
  dayOfWeek: number;
  isWorking: boolean;
  morningStart: string | null;
  morningEnd: string | null;
  eveningStart: string | null;
  eveningEnd: string | null;
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();
    const { schedules, jobDurationMinutes, bufferMinutes, autoConfirmBookings } = body;

    if (!Array.isArray(schedules) || schedules.length !== 7) {
      return NextResponse.json({ error: "Please provide a schedule for all 7 days." }, { status: 400 });
    }

    if (typeof jobDurationMinutes !== "number" || jobDurationMinutes < 15 || jobDurationMinutes > 480) {
      return NextResponse.json({ error: "Job duration must be between 15 minutes and 8 hours." }, { status: 400 });
    }

    if (typeof bufferMinutes !== "number" || bufferMinutes < 0 || bufferMinutes > 120) {
      return NextResponse.json({ error: "Buffer time must be between 0 and 120 minutes." }, { status: 400 });
    }

    // Validate each day
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const day of schedules as ScheduleDay[]) {
      if (typeof day.dayOfWeek !== "number" || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        return NextResponse.json({ error: "Invalid day of week." }, { status: 400 });
      }
      if (day.isWorking) {
        const hasMorning = day.morningStart && day.morningEnd;
        const hasEvening = day.eveningStart && day.eveningEnd;
        if (!hasMorning && !hasEvening) {
          return NextResponse.json({ error: "Working days must have at least one shift." }, { status: 400 });
        }
        if (hasMorning) {
          if (!timeRegex.test(day.morningStart!) || !timeRegex.test(day.morningEnd!)) {
            return NextResponse.json({ error: "Times must be in HH:mm format." }, { status: 400 });
          }
          if (day.morningStart! >= day.morningEnd!) {
            return NextResponse.json({ error: "Morning end time must be after start time." }, { status: 400 });
          }
        }
        if (hasEvening) {
          if (!timeRegex.test(day.eveningStart!) || !timeRegex.test(day.eveningEnd!)) {
            return NextResponse.json({ error: "Times must be in HH:mm format." }, { status: 400 });
          }
          if (day.eveningStart! >= day.eveningEnd!) {
            return NextResponse.json({ error: "Evening end time must be after start time." }, { status: 400 });
          }
        }
        if (hasMorning && hasEvening && day.morningEnd! > day.eveningStart!) {
          return NextResponse.json({ error: "Morning shift must end before evening shift starts." }, { status: 400 });
        }
      }
    }

    // Upsert all 7 days + update user settings in a transaction
    await prisma.$transaction([
      ...(schedules as ScheduleDay[]).map((day) =>
        prisma.weeklySchedule.upsert({
          where: {
            contractorId_dayOfWeek: {
              contractorId: session.user.id,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isWorking: day.isWorking,
            morningStart: day.isWorking ? day.morningStart : null,
            morningEnd: day.isWorking ? day.morningEnd : null,
            eveningStart: day.isWorking ? day.eveningStart : null,
            eveningEnd: day.isWorking ? day.eveningEnd : null,
          },
          create: {
            contractorId: session.user.id,
            dayOfWeek: day.dayOfWeek,
            isWorking: day.isWorking,
            morningStart: day.isWorking ? day.morningStart : null,
            morningEnd: day.isWorking ? day.morningEnd : null,
            eveningStart: day.isWorking ? day.eveningStart : null,
            eveningEnd: day.isWorking ? day.eveningEnd : null,
          },
        })
      ),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          jobDurationMinutes,
          bufferMinutes,
          autoConfirmBookings: !!autoConfirmBookings,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
