import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Called by n8n workflow to check if a quote is still PENDING
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify callback secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.N8N_CALLBACK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: quote.status });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
