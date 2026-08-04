"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedLogo } from "@/components/shared/AnimatedLogo";

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
    const base = process.env.NEXT_PUBLIC_API_URL || "https://backend-teaching.vercel.app/api/v1";
    console.log("[LOGIN] Submitting to:", `${base}/auth/login`, { identifier, password: "***" });
    try {
      const user = await login(identifier, password);
      console.log("[LOGIN] Success — user:", { id: user.id, username: user.username, role: user.role });
      const decoded = next ? decodeURIComponent(next) : null;
      if (decoded && decoded.startsWith("/")) {
        console.log("[LOGIN] Redirecting to (next):", decoded);
        router.push(decoded);
        return;
      }
      const role = user.role;
      console.log("[LOGIN] Redirecting based on role:", role);
      if (role === "admin") router.push("/admin");
      else if (role === "teacher") router.push("/teacher/dashboard");
      else router.push("/student/dashboard");
    } catch (err: any) {
      console.error("[LOGIN] Error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 sm:w-9 sm:h-9 flex items-center justify-center">
              <AnimatedLogo size={28} className="text-[#D6F63E]" />
            </div>
            <span className="text-2xl sm:text-xl font-bold tracking-tight text-[#0F0F0F]">
              CodeBuddy
            </span>
          </Link>
          <h1 className="text-3xl sm:text-2xl font-bold text-[#0F0F0F] mb-2">
            Welcome back
          </h1>
           <h2 className="text-3xl sm:text-2xl font-bold text-[#0F0F0F] mb-6">
            Demo Sign in Data
          </h2>
          <p className=" text-base sm:text-sm "> 
            Email: 
          </p> 
            
           <p className=" text-base sm:text-sm mb-1 font-bold font-xl mb-2 cursor-pointer hover:underline text-[#0F0F0F]" onClick={() => { setIdentifier("Student@test.com"); setPassword("12345678"); }}> 
            Student@test.com
            </p>

            <p className=" text-base sm:text-sm "> 
            Password: 
          </p> 
            
           <p className=" text-base sm:text-sm mb-1 font-bold  mb-2 cursor-pointer hover:underline text-[#0F0F0F]" onClick={() => { setIdentifier("Student@test.com"); setPassword("12345678"); }} > 
            12345678
            </p>
         
         
          <p className="text-[#6B6B6B] text-base sm:text-sm">Sign in to continue learning</p>
          <button
            type="button"
            onClick={() => { setIdentifier("Student@test.com"); setPassword("12345678"); }}
            className="mt-4 w-full px-4 py-3 bg-[#0F0F0F] text-[#D6F63E] rounded-full font-semibold text-base sm:text-sm hover:bg-[#1a1a1a] transition-colors"
          >
            Use demo credentials
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] p-6 sm:p-8 shadow-card"
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
              className="w-full px-4 py-3.5 sm:py-3 border border-[#E5E5E5] rounded-2xl sm:rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
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
              className="w-full px-4 py-3.5 sm:py-3 border border-[#E5E5E5] rounded-2xl sm:rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E] focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 sm:py-3 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-semibold text-base sm:text-sm hover:bg-[#c5e535] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        </div>
      </div>
    </div>
  );
}
