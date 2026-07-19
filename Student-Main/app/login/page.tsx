"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";

function IconCode({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EDEDED] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#D6F63E] border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(identifier, password);
      // If a ?next= redirect was specified, go there first (only internal paths)
      const decoded = next ? decodeURIComponent(next) : null;
      if (decoded && decoded.startsWith("/")) {
        router.push(decoded);
        return;
      }
      const role = user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
            Welcome back
          </h1>
          <p className="text-[#6B6B6B] text-sm">Sign in to continue learning</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] p-8 shadow-card"
        >
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#0F0F0F] mb-1.5">
              Email or Username
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0F0F0F] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-semibold text-sm hover:bg-[#c5e535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 mt-6">
          <p className="text-center text-sm text-[#6B6B6B]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#0F0F0F] hover:underline font-semibold"
            >
              Register as a Student
            </Link>
          </p>
          <p className="text-center text-sm text-[#6B6B6B]">
            Want to try the whiteboard?{" "}
            <Link
              href="/request-access?feature=whiteboard"
              className="text-[#0F0F0F] hover:underline font-semibold"
            >
              Request Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
