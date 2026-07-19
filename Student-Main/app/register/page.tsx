"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStudent } from "@/lib/api";

export default function StudentRegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    schoolEmail: "",
    parentPhone: "",
    nationalId: "",
    dateOfBirth: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerStudent(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#D6F63E]/30 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 className="text-xl font-bold text-[#0F0F0F] mb-2">Registration Submitted</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">A teacher will review your details and approve your account. You&apos;ll be able to log in once approved.</p>
          <Link href="/" className="flux-btn-primary inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#0F0F0F] mb-1">Student Registration</h2>
        <p className="text-sm text-[#6B6B6B] mb-6">Submit your details for teacher approval. Your account activates once a teacher reviews and approves your request.</p>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Username" value={form.username} onChange={(v) => update("username", v)} required />
          <Field label="School Email" type="email" value={form.schoolEmail} onChange={(v) => update("schoolEmail", v)} required />
          <Field label="Parent Phone Number" value={form.parentPhone} onChange={(v) => update("parentPhone", v)} required />
          <Field label="National ID Number" value={form.nationalId} onChange={(v) => update("nationalId", v)} required />
          <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} required />
          <Field label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} required />

          <button type="submit" disabled={loading} className="flux-btn-primary w-full mt-2 disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>

        <p className="text-xs text-[#6B6B6B] text-center mt-5">
          Already have an account? <Link href="/login" className="font-semibold text-[#0F0F0F]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-[#F5F5F5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E]"
      />
    </label>
  );
}
