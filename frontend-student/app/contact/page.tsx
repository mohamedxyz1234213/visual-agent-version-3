"use client";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#EDEDED] px-6 py-16">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#0F0F0F] mb-2">Contact Us</h2>
        <p className="text-sm text-[#6B6B6B] mb-8">Questions about CodeBuddy, your child&apos;s account, or a school partnership? Reach out and our team will get back to you.</p>

        <div className="space-y-5">
          <ContactRow label="Support Email" value="support@codebuddy.app" />
          <ContactRow label="Schools & Partnerships" value="partnerships@codebuddy.app" />
          <ContactRow label="Response Time" value="Within 1-2 business days" />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
      <span className="text-sm text-[#6B6B6B]">{label}</span>
      <span className="text-sm font-semibold text-[#0F0F0F]">{value}</span>
    </div>
  );
}
