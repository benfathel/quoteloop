import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Find the first user in the database
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No users found. Register an account first.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Using contractor: ${user.name} (${user.businessName})`);

  // Create a quote with createdAt = 3 days ago
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const quote = await prisma.quote.create({
    data: {
      customerName: "Test Customer",
      customerPhone: "+21658888294",
      jobDescription: "Fix leaking pipe under kitchen sink",
      quoteAmount: 350,
      contractorId: user.id,
      createdAt: threeDaysAgo,
    },
  });

  console.log(`Created test quote: ${quote.id}`);
  console.log(`  Customer phone: +21658888294`);
  console.log(`  Created at: ${threeDaysAgo.toISOString()} (3 days ago)`);
  console.log(`  Status: PENDING`);
  console.log("");
  console.log("Now call the cron endpoint to trigger the 48h follow-up:");
  console.log(`  curl -H "Authorization: Bearer ${process.env.CRON_SECRET}" http://localhost:3000/api/cron/follow-ups`);

  await prisma.$disconnect();
}

main().catch(console.error);
