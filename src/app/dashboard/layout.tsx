import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import ToastProvider from "@/components/ToastProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — QuoteLoop",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-page-bg">
        <Sidebar />
        {/* Desktop: offset by sidebar width. Mobile: offset by top bar + bottom nav */}
        <main className="md:ml-[220px] pt-16 pb-20 md:pt-8 md:pb-8 px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
