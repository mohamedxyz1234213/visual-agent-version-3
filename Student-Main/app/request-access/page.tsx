"use client";

import Link from "next/link";
import { useState } from "react";
import { requestEarlyAccess } from "@/lib/api";

function IconCheck({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="#22C55E" className={className}>
      <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.15)" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

function IconCode({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconBoard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user came from whiteboard button
  const isWhiteboardRequest =
    typeof window !== "undefined" &&
    window.location.search.includes("feature=whiteboard");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const finalReason = isWhiteboardRequest
        ? `Whiteboard access request${reason ? `: ${reason}` : ""}`
        : reason;
      await requestEarlyAccess({ email, username, reason: finalReason });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <IconCheck className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F0F0F] mb-3">
            Request Received!
          </h1>
          <p className="text-[#6B6B6B] mb-8 text-sm leading-relaxed">
            {isWhiteboardRequest
              ? "Your whiteboard access request has been sent to our team. You'll receive an email with an invite link once approved."
              : "Your request has been sent to our team. You'll receive an email with an invite link once approved."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] text-white rounded-full font-semibold text-sm hover:bg-[#333] transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-[#171717] rounded-lg flex items-center justify-center">
              <IconCode className="w-5 h-5 text-[#D6F63E]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F0F0F]">
              CodeBuddy
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F0F0F] mb-2">
            {isWhiteboardRequest
              ? "Request Whiteboard Access"
              : "Request Early Access"}
          </h1>
          <p className="text-[#6B6B6B] text-sm">
            {isWhiteboardRequest
              ? "Get access to the interactive whiteboard classroom"
              : "Join the waitlist and we'll get you started soon"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] p-8 shadow-card"
        >
          {isWhiteboardRequest && (
            <div className="mb-5 flex items-center gap-3 p-3 bg-[#D6F63E]/10 rounded-xl">
              <IconBoard className="w-5 h-5 text-[#0F0F0F] flex-shrink-0" />
              <span className="text-[13px] font-medium text-[#0F0F0F]">
                Whiteboard access requires approval
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#0F0F0F] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#0F0F0F] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
              placeholder="Choose a username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0F0F0F] mb-1.5">
              Why do you want access? (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-semibold text-sm hover:bg-[#c5e535] transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#0F0F0F] hover:underline font-semibold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
