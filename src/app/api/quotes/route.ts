import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { triggerFollowUpWorkflow } from "@/lib/n8n";
import { sendMessage } from "@/lib/messaging";
import { getFollowUpMessage } from "@/lib/sms-templates";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const quotes = await prisma.quote.findMany({
      where: { contractorId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json(
      { error: "We're having trouble connecting. Please refresh." },
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

    // Check free plan quota
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true, quotesUsedThisMonth: true, autoFollowUpsUsedThisMonth: true, jobDurationMinutes: true, name: true, businessName: true, phone: true, defaultFollowUp2Minutes: true, defaultFollowUp3Minutes: true, defaultFollowUp4Minutes: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.subscriptionStatus === "FREE" && user.quotesUsedThisMonth >= 9) {
      return NextResponse.json(
        { error: "You've used all 9 of your free quotes this month. Upgrade to Plus for unlimited quotes." },
        { status: 403 }
      );
    }

    const canAutoFollowUp = user.subscriptionStatus !== "FREE" || user.autoFollowUpsUsedThisMonth < 3;

    const { customerName, customerPhone, quoteAmount, durationMinutes } = await request.json();

    if (!customerPhone || !quoteAmount) {
      return NextResponse.json({ error: "Please enter a phone number and quote amount." }, { status: 400 });
    }

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please enter a valid quote amount." }, { status: 400 });
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number with at least 10 digits." }, { status: 400 });
    }

    const duration = typeof durationMinutes === "number" && durationMinutes >= 15 && durationMinutes <= 480
      ? durationMinutes : user.jobDurationMinutes ?? 60;

    // Auto-expire at the last follow-up time
    const expiresAt = new Date(Date.now() + user.defaultFollowUp4Minutes * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        customerName: customerName?.trim() || null,
        customerPhone,
        quoteAmount: amount,
        durationMinutes: duration,
        expiresAt,
        contractorId: session.user.id,
      },
    });

    // Increment usage for free plan users
    if (user.subscriptionStatus === "FREE") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { quotesUsedThisMonth: { increment: 1 } },
      });
    }

    // Send first follow-up immediately
    if (canAutoFollowUp) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const formLink = user.subscriptionStatus === "PLUS"
          ? `${baseUrl}/form/${quote.formToken}`
          : null;

        const message = getFollowUpMessage(1, quote.customerName, user.name, user.businessName, formLink);
        const sent = await sendMessage(quote.customerPhone, message);

        if (sent) {
          await prisma.quote.update({
            where: { id: quote.id },
            data: { followUpSentAt1: new Date() },
          });
        }

        // Trigger n8n workflow for remaining follow-ups (3h, 9h, 24h)
        const result = await triggerFollowUpWorkflow({
          quoteId: quote.id,
          customerName: quote.customerName,
          customerPhone: quote.customerPhone,
          contractorName: user.name,
          businessName: user.businessName,
          contractorPhone: user.phone,
          quoteAmount: amount,
          jobDescription: null,
          callbackBaseUrl: baseUrl,
          callbackSecret: process.env.N8N_CALLBACK_SECRET || "",
          formLink,
          followUp2Minutes: user.defaultFollowUp2Minutes,
          followUp3Minutes: user.defaultFollowUp3Minutes,
          followUp4Minutes: user.defaultFollowUp4Minutes,
        });

        if (result?.executionId) {
          await prisma.quote.update({
            where: { id: quote.id },
            data: { n8nExecutionId: result.executionId },
          });
        }

        // Increment auto follow-up usage for free users
        if (user.subscriptionStatus === "FREE") {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { autoFollowUpsUsedThisMonth: { increment: 1 } },
          });
        }
      } catch (err) {
        console.error("Failed to send follow-up:", err);
      }
    }

    return NextResponse.json(quote, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
