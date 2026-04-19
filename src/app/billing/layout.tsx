import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing — QuoteLoop",
};

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      <Sidebar />
      <main className="md:ml-[240px] pt-20 pb-24 md:pt-8 md:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
