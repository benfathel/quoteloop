import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cancelExecution } from "@/lib/n8n";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const { ids, action } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items selected." }, { status: 400 });
    }

    if (!["WON", "LOST", "PENDING", "DELETE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    // Verify ownership
    const quotes = await prisma.quote.findMany({
      where: { id: { in: ids }, contractorId: session.user.id },
      select: { id: true, n8nExecutionId: true },
    });

    const ownedIds = quotes.map((q) => q.id);

    if (action === "DELETE") {
      // Cancel n8n executions
      for (const q of quotes) {
        if (q.n8nExecutionId) {
          try { await cancelExecution(q.n8nExecutionId); } catch { /* ignore */ }
        }
      }

      await prisma.quote.deleteMany({
        where: { id: { in: ownedIds } },
      });

      return NextResponse.json({ success: true, count: ownedIds.length });
    }

    // Status update
    if (action === "WON" || action === "LOST") {
      // Cancel follow-ups for won/lost
      for (const q of quotes) {
        if (q.n8nExecutionId) {
          try { await cancelExecution(q.n8nExecutionId); } catch { /* ignore */ }
        }
      }
    }

    await prisma.quote.updateMany({
      where: { id: { in: ownedIds } },
      data: {
        status: action as "WON" | "LOST" | "PENDING",
        ...(action !== "PENDING" ? { followUpCancelled: true } : {}),
      },
    });

    return NextResponse.json({ success: true, count: ownedIds.length });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
