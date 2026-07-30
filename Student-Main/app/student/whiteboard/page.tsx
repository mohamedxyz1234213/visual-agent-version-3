"use client";

import { AuthGate } from "@/components/Auth/AuthGate";
import { WhiteboardLessonLibrary } from "@/components/Whiteboard/WhiteboardLessonLibrary";
import { IconPalette } from "@/components/shared/FluxIcons";

export default function WhiteboardPage() {
  return (
    <AuthGate>
      <WhiteboardLessonLibrary
        icon={<IconPalette size={18} className="text-[#0F0F0F]" />}
        title="My Whiteboard Lessons"
        subtitle="Whiteboard"
      />
    </AuthGate>
  );
}
