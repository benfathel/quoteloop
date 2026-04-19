"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+1");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setStep("otp");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      phone,
      otp,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            Log in to manage your quotes
          </p>
        </div>

        <div className="bg-surface border border-dark-border rounded-[20px] p-8 sm:p-10">
          {registered && (
            <div className="bg-success-green/10 text-emerald-400 border border-success-green/30 px-4 py-3 rounded-btn text-sm mb-5">
              Account created! You can now log in.
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-3 rounded-btn text-sm mb-5">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
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
                {loading ? "Sending code..." : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <p className="text-txt-secondary text-sm mb-4">
                  We sent a verification code to your Telegram. Enter it
                  below.
                </p>
                <label className="block text-sm font-medium text-txt-secondary mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                  placeholder="123456"
                  className="input-dark text-center text-lg tracking-[0.3em] font-semibold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3.5 rounded-btn transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Verifying..." : "Verify and log in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="w-full text-txt-secondary text-sm hover:text-txt-primary transition-colors"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-txt-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand-500 font-semibold hover:text-brand-400 transition-colors duration-200"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
