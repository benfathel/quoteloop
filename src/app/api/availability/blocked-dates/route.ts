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

    const blockedDates = await prisma.blockedDate.findMany({
      where: { contractorId: session.user.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(blockedDates);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    // Normalize to midnight UTC
    parsedDate.setUTCHours(0, 0, 0, 0);

    // Don't allow blocking dates in the past
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return NextResponse.json({ error: "Cannot block dates in the past." }, { status: 400 });
    }

    const blockedDate = await prisma.blockedDate.upsert({
      where: {
        contractorId_date: {
          contractorId: session.user.id,
          date: parsedDate,
        },
      },
      update: { reason: reason?.trim() || null },
      create: {
        contractorId: session.user.id,
        date: parsedDate,
        reason: reason?.trim() || null,
      },
    });

    return NextResponse.json(blockedDate, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
