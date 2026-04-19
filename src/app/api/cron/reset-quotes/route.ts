import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reset quotesUsedThisMonth to 0 for all FREE users
    const result = await prisma.user.updateMany({
      where: { subscriptionStatus: "FREE" },
      data: {
        quotesUsedThisMonth: 0,
        autoFollowUpsUsedThisMonth: 0,
        quotesResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`Reset quote usage for ${result.count} free users`);

    return NextResponse.json({ reset: result.count });
  } catch (error) {
    console.error("Error resetting quote usage:", error);
    return NextResponse.json(
      { error: "Failed to reset quote usage." },
      { status: 500 }
    );
  }
}
