"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPalette } from "@/components/shared/FluxIcons";
import { AuthGate } from "@/components/Auth/AuthGate";

export default function StudentWhiteboardPage() {
  const router = useRouter();

  return (
    <AuthGate>
      <RedirectToUpload router={router} />
    </AuthGate>
  );
}

function RedirectToUpload({ router }: { router: ReturnType<typeof useRouter> }) {
  useEffect(() => {
    router.replace("/upload");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#D4F542]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <IconPalette size={28} className="text-[#18181B]" />
        </div>
        <h3 className="text-lg font-semibold text-[#18181B] mb-2">Opening Whiteboard...</h3>
        <p className="text-sm text-gray-500">Redirecting to the interactive whiteboard.</p>
      </div>
    </div>
  );
}
