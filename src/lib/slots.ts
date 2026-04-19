import { prisma } from "@/lib/prisma";

export interface TimeSlot {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
}

/**
 * Returns available appointment slots for a contractor within a date range.
 * Excludes blocked dates, non-working days, and times with existing bookings.
 */
export async function getAvailableSlots(
  contractorId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const [schedules, blockedDates, existingBookings, contractor] = await Promise.all([
    prisma.weeklySchedule.findMany({
      where: { contractorId },
    }),
    prisma.blockedDate.findMany({
      where: {
        contractorId,
        date: { gte: startDate, lte: endDate },
      },
    }),
    prisma.booking.findMany({
      where: {
        contractorId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        appointmentStart: { lte: endDate },
        appointmentEnd: { gte: startDate },
      },
      select: { appointmentStart: true, appointmentEnd: true },
    }),
    prisma.user.findUnique({
      where: { id: contractorId },
      select: { bufferMinutes: true },
    }),
  ]);

  const bufferMinutes = contractor?.bufferMinutes ?? 0;

  // Build a map of dayOfWeek -> shifts (morning and/or evening)
  const scheduleMap = new Map<number, { startTime: string; endTime: string }[]>();
  for (const s of schedules) {
    if (!s.isWorking) continue;
    const shifts: { startTime: string; endTime: string }[] = [];
    if (s.morningStart && s.morningEnd) {
      shifts.push({ startTime: s.morningStart, endTime: s.morningEnd });
    }
    if (s.eveningStart && s.eveningEnd) {
      shifts.push({ startTime: s.eveningStart, endTime: s.eveningEnd });
    }
    if (shifts.length > 0) {
      scheduleMap.set(s.dayOfWeek, shifts);
    }
  }

  // Build a set of blocked date strings
  const blockedSet = new Set(
    blockedDates.map((b) => {
      const d = b.date;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  const slots: TimeSlot[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    const dayOfWeek = current.getDay(); // 0=Sunday

    // Skip non-working days and blocked dates
    const shifts = scheduleMap.get(dayOfWeek);
    if (!shifts || blockedSet.has(dateStr)) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Generate slots for each shift (morning and/or evening)
    for (const shift of shifts) {
      const [startH, startM] = shift.startTime.split(":").map(Number);
      const [endH, endM] = shift.endTime.split(":").map(Number);

      const shiftStart = new Date(current);
      shiftStart.setHours(startH, startM, 0, 0);

      const shiftEnd = new Date(current);
      shiftEnd.setHours(endH, endM, 0, 0);

      let slotStart = new Date(shiftStart);
      while (true) {
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        if (slotEnd > shiftEnd) break;

        // Check if slot overlaps with any existing booking (including buffer)
        const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferMinutes * 60000);

        const hasConflict = existingBookings.some((booking) => {
          const bookingEndWithBuffer = new Date(
            booking.appointmentEnd.getTime() + bufferMinutes * 60000
          );
          return slotStart < bookingEndWithBuffer && slotEndWithBuffer > booking.appointmentStart;
        });

        // Skip slots in the past
        const now = new Date();
        if (!hasConflict && slotStart > now) {
          const startTimeStr = `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`;
          const endTimeStr = `${String(slotEnd.getHours()).padStart(2, "0")}:${String(slotEnd.getMinutes()).padStart(2, "0")}`;

          slots.push({
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            startDateTime: slotStart.toISOString(),
            endDateTime: slotEnd.toISOString(),
          });
        }

        slotStart = new Date(slotStart.getTime() + (durationMinutes + bufferMinutes) * 60000);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}
