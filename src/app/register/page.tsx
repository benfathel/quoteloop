"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const businessName = formData.get("businessName") as string;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, businessName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-page-bg">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-txt-primary tracking-tight"
          >
            QuoteLoop
          </Link>
          <p className="text-txt-secondary mt-2 text-sm">
            Create your account — it takes 30 seconds
          </p>
        </div>

        <div className="bg-surface border border-dark-border rounded-[20px] p-8 sm:p-10">
          {error && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-btn text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-txt-secondary mb-2"
              >
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Mike Johnson"
                className="input-dark"
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-txt-secondary mb-2"
              >
                Business name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                placeholder="e.g. Johnson Plumbing"
                className="input-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-2">
                Phone number
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creating your account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-txt-secondary mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-500 font-semibold hover:text-brand-400 transition-colors duration-200"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
