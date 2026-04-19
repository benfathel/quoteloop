"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-blue-600">
          QuoteLoop
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/billing"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Billing
          </Link>
          <span className="text-sm text-gray-600 hidden sm:inline">
            {session.user.businessName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
