"use client";

import Link from "next/link";
import { useState } from "react";
import { requestEarlyAccess } from "@/lib/api";

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestEarlyAccess({ email, username, reason });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#22C55E]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Request Received!</h1>
          <p className="text-gray-400 mb-8">
            Your request has been sent to our team. You&apos;ll receive an email with an invite link once approved.
          </p>
          <Link href="/login" className="inline-block px-6 py-3 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#D4F542] rounded-lg flex items-center justify-center">
              <span className="text-[#18181B] font-bold">CT</span>
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">CodeBuddy</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Request Early Access</h1>
          <p className="text-gray-400 text-sm">Join the waitlist and we&apos;ll get you started soon</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#18181B] mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent"
              placeholder="you@example.com" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#18181B] mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent"
              placeholder="Choose a username" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#18181B] mb-1.5">Why do you want access? (optional)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent resize-none"
              placeholder="Tell us about yourself..." />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors disabled:opacity-50">
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link href="/login" className="text-[#D4F542] hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
