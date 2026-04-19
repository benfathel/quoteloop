import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cancelExecution, triggerFollowUpWorkflow } from "@/lib/n8n";
import { sendMessage } from "@/lib/messaging";
import { getFollowUpMessage } from "@/lib/sms-templates";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();
    const { status, cancelFollowUps } = body;

    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote || quote.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    // Handle cancel follow-ups
    if (cancelFollowUps) {
      if (quote.n8nExecutionId) {
        try { await cancelExecution(quote.n8nExecutionId); } catch { /* ignore */ }
      }
      const updated = await prisma.quote.update({
        where: { id },
        data: { followUpCancelled: true, n8nExecutionId: null },
      });
      return NextResponse.json(updated);
    }

    if (!status || !["PENDING", "WON", "LOST"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    // Cancel n8n execution if moving away from PENDING
    if (status !== "PENDING" && quote.status === "PENDING" && quote.n8nExecutionId) {
      try { await cancelExecution(quote.n8nExecutionId); } catch { /* ignore */ }
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status,
        n8nExecutionId: status !== "PENDING" ? null : quote.n8nExecutionId,
        followUpCancelled: status !== "PENDING" ? quote.followUpCancelled : false,
      },
    });

    // Re-trigger workflow if going back to PENDING
    if (status === "PENDING" && quote.status !== "PENDING") {
      try {
        const contractor = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, businessName: true, phone: true, subscriptionStatus: true, defaultFollowUp2Minutes: true, defaultFollowUp3Minutes: true, defaultFollowUp4Minutes: true },
        });

        if (contractor) {
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          const formLink = contractor.subscriptionStatus === "PLUS"
            ? `${baseUrl}/form/${quote.formToken}`
            : null;

          // Send immediate follow-up
          const message = getFollowUpMessage(1, quote.customerName, contractor.name, contractor.businessName, formLink);
          const sent = await sendMessage(quote.customerPhone, message);
          if (sent) {
            await prisma.quote.update({ where: { id }, data: { followUpSentAt1: new Date() } });
          }

          // Reset expiry based on last follow-up timing
          await prisma.quote.update({
            where: { id },
            data: { expiresAt: new Date(Date.now() + contractor.defaultFollowUp4Minutes * 60 * 1000) },
          });

          const result = await triggerFollowUpWorkflow({
            quoteId: quote.id,
            customerName: quote.customerName,
            customerPhone: quote.customerPhone,
            contractorName: contractor.name,
            businessName: contractor.businessName,
            contractorPhone: contractor.phone,
            quoteAmount: quote.quoteAmount,
            jobDescription: quote.jobDescription,
            callbackBaseUrl: baseUrl,
            callbackSecret: process.env.N8N_CALLBACK_SECRET || "",
            formLink,
            followUp2Minutes: contractor.defaultFollowUp2Minutes,
            followUp3Minutes: contractor.defaultFollowUp3Minutes,
            followUp4Minutes: contractor.defaultFollowUp4Minutes,
          });

          if (result?.executionId) {
            await prisma.quote.update({ where: { id }, data: { n8nExecutionId: result.executionId } });
          }
        }
      } catch (err) {
        console.error("Failed to re-trigger workflow:", err);
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote || quote.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    const body = await request.json();
    const { customerName, customerPhone, quoteAmount, durationMinutes } = body;

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

    const updateData: Record<string, unknown> = {
      customerName: customerName?.trim() || null,
      customerPhone,
      quoteAmount: amount,
    };

    if (typeof durationMinutes === "number" && durationMinutes >= 15 && durationMinutes <= 480) {
      updateData.durationMinutes = durationMinutes;
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote || quote.contractorId !== session.user.id) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.n8nExecutionId) {
      try { await cancelExecution(quote.n8nExecutionId); } catch { /* ignore */ }
    }

    await prisma.quote.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
