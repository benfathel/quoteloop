import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FIELD_MAP: Record<number, string> = {
  1: "followUpSentAt1",
  2: "followUpSentAt2",
  3: "followUpSentAt3",
  4: "followUpSentAt4",
};

// Called by n8n workflow after sending a follow-up message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.N8N_CALLBACK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followUpNumber } = await request.json();

    const field = FIELD_MAP[followUpNumber];
    if (!field) {
      return NextResponse.json({ error: "followUpNumber must be 1, 2, 3, or 4" }, { status: 400 });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await prisma.quote.update({
      where: { id },
      data: { [field]: new Date() },
    });

    // Auto-mark as LOST after final follow-up
    if (followUpNumber === 4 && quote.status === "PENDING") {
      await prisma.quote.update({
        where: { id },
        data: { status: "LOST" },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
