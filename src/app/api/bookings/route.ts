import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { contractorId: session.user.id };

    if (status && ["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED", "CANCELLED", "DECLINED"].includes(status)) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.appointmentStart = {};
      if (startDate) (where.appointmentStart as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.appointmentStart as Record<string, Date>).lte = new Date(endDate);
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { appointmentStart: "asc" },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
