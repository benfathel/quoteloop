import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  bookingId?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      bookingId: bookingId || null,
    },
  });
}
