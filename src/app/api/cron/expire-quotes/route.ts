import { prisma } from "@/lib/prisma";
import { cancelExecution } from "@/lib/n8n";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all PENDING quotes that have expired
    const expiredQuotes = await prisma.quote.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lte: new Date() },
      },
    });

    let closed = 0;
    for (const quote of expiredQuotes) {
      // Cancel n8n execution if active
      if (quote.n8nExecutionId) {
        try {
          await cancelExecution(quote.n8nExecutionId);
        } catch {
          // continue even if cancel fails
        }
      }

      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: "LOST",
          n8nExecutionId: null,
          followUpCancelled: true,
        },
      });
      closed++;
    }

    console.log(`Auto-closed ${closed} expired quotes`);
    return NextResponse.json({ closed });
  } catch (error) {
    console.error("Error closing expired quotes:", error);
    return NextResponse.json(
      { error: "Failed to close expired quotes." },
      { status: 500 }
    );
  }
}
