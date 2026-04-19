import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    if (!["DELETE", "CONFIRMED", "COMPLETED"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    // Verify ownership
    const bookings = await prisma.booking.findMany({
      where: { id: { in: ids }, contractorId: session.user.id },
      select: { id: true, quoteId: true },
    });

    const ownedIds = bookings.map((b) => b.id);

    if (action === "DELETE") {
      // Delete notifications first
      await prisma.notification.deleteMany({
        where: { bookingId: { in: ownedIds } },
      });

      // Unlink quotes
      const quoteIds = bookings.filter((b) => b.quoteId).map((b) => b.quoteId!);
      if (quoteIds.length > 0) {
        await prisma.quote.updateMany({
          where: { id: { in: quoteIds } },
          data: { formSubmittedAt: null },
        });
      }

      await prisma.booking.deleteMany({
        where: { id: { in: ownedIds } },
      });

      return NextResponse.json({ success: true, count: ownedIds.length });
    }

    // Status updates
    if (action === "CONFIRMED") {
      await prisma.booking.updateMany({
        where: { id: { in: ownedIds }, status: "PENDING_CONFIRMATION" },
        data: { status: "CONFIRMED", confirmedAt: new Date(), holdExpiresAt: null },
      });
    }

    if (action === "COMPLETED") {
      await prisma.booking.updateMany({
        where: { id: { in: ownedIds }, status: "CONFIRMED" },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({ success: true, count: ownedIds.length });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
