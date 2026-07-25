"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LearnPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/avatar-teacher");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-[#6B6B6B]">
        <div className="w-5 h-5 border-2 border-[#E5E5E5] border-t-[#D6F63E] rounded-full animate-spin" />
        <span className="text-sm">Redirecting…</span>
      </div>
    </div>
  );
}
