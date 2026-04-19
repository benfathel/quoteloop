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
        subscriptionStatus: true,
        quotesUsedThisMonth: true,
        quotesResetAt: true,
        autoFollowUpsUsedThisMonth: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      subscriptionStatus: user.subscriptionStatus,
      quotesUsedThisMonth: user.quotesUsedThisMonth,
      quotesResetAt: user.quotesResetAt,
      autoFollowUpsUsedThisMonth: user.autoFollowUpsUsedThisMonth,
    });
  } catch {
    return NextResponse.json(
      { error: "We're having trouble connecting. Please refresh." },
      { status: 500 }
    );
  }
}
