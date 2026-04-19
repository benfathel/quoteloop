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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        businessName: true,
        phone: true,
        jobDurationMinutes: true,
        bufferMinutes: true,
        autoConfirmBookings: true,
        defaultFollowUp2Minutes: true,
        defaultFollowUp3Minutes: true,
        defaultFollowUp4Minutes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();
    const { name, businessName, phone, defaultFollowUp2Minutes, defaultFollowUp3Minutes, defaultFollowUp4Minutes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!businessName || typeof businessName !== "string" || !businessName.trim()) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number (at least 10 digits)." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { phone, id: { not: session.user.id } },
    });
    if (existingUser) {
      return NextResponse.json({ error: "This phone number is already in use." }, { status: 409 });
    }

    // Build update data
    const data: Record<string, unknown> = {
      name: name.trim(),
      businessName: businessName.trim(),
      phone,
    };

    // Validate and add follow-up timing if provided
    if (typeof defaultFollowUp2Minutes === "number" && defaultFollowUp2Minutes >= 5 && defaultFollowUp2Minutes <= 43200) {
      data.defaultFollowUp2Minutes = defaultFollowUp2Minutes;
    }
    if (typeof defaultFollowUp3Minutes === "number" && defaultFollowUp3Minutes >= 5 && defaultFollowUp3Minutes <= 43200) {
      data.defaultFollowUp3Minutes = defaultFollowUp3Minutes;
    }
    if (typeof defaultFollowUp4Minutes === "number" && defaultFollowUp4Minutes >= 5 && defaultFollowUp4Minutes <= 43200) {
      data.defaultFollowUp4Minutes = defaultFollowUp4Minutes;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        name: true,
        businessName: true,
        phone: true,
        defaultFollowUp2Minutes: true,
        defaultFollowUp3Minutes: true,
        defaultFollowUp4Minutes: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
