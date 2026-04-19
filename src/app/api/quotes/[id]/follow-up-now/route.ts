import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/messaging";
import { getFollowUpMessage } from "@/lib/sms-templates";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        contractor: {
          select: { name: true, businessName: true, subscriptionStatus: true },
        },
      },
    });

    if (!quote || quote.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.status !== "PENDING") {
      return NextResponse.json({ error: "Follow-ups can only be sent for pending quotes." }, { status: 400 });
    }

    // Determine which follow-up to send next
    const sent = [quote.followUpSentAt1, quote.followUpSentAt2, quote.followUpSentAt3, quote.followUpSentAt4];
    const nextNumber = (sent.filter(Boolean).length + 1) as 1 | 2 | 3 | 4;

    if (nextNumber > 4) {
      return NextResponse.json({ error: "All follow-ups have been sent." }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const formLink = quote.contractor.subscriptionStatus === "PLUS"
      ? `${baseUrl}/form/${quote.formToken}`
      : null;

    const message = getFollowUpMessage(nextNumber, quote.customerName, quote.contractor.name, quote.contractor.businessName, formLink);
    const success = await sendMessage(quote.customerPhone, message);

    if (!success) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    const fieldMap = { 1: "followUpSentAt1", 2: "followUpSentAt2", 3: "followUpSentAt3", 4: "followUpSentAt4" } as const;

    const updated = await prisma.quote.update({
      where: { id },
      data: { [fieldMap[nextNumber]]: new Date() },
    });

    return NextResponse.json({
      success: true,
      followUpSentAt1: updated.followUpSentAt1,
      followUpSentAt2: updated.followUpSentAt2,
      followUpSentAt3: updated.followUpSentAt3,
      followUpSentAt4: updated.followUpSentAt4,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
