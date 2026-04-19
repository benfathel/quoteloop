import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slots";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get("contractorId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const durationStr = searchParams.get("duration");

    if (!contractorId) {
      return NextResponse.json({ error: "Contractor ID is required." }, { status: 400 });
    }

    const contractor = await prisma.user.findUnique({
      where: { id: contractorId },
      select: { jobDurationMinutes: true },
    });

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found." }, { status: 404 });
    }

    const durationMinutes = durationStr ? parseInt(durationStr, 10) : contractor.jobDurationMinutes;
    if (isNaN(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
      return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
    }

    // Default: next 14 days
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }

    const slots = await getAvailableSlots(contractorId, startDate, endDate, durationMinutes);

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
