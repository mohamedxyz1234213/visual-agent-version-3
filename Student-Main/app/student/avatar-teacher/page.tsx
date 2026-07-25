"use client";

import { WhiteboardLessonLibrary } from "@/components/Whiteboard/WhiteboardLessonLibrary";
import { IconRobot } from "@/components/shared/FluxIcons";

export default function AvatarTeacherPage() {
  return (
    <WhiteboardLessonLibrary
      icon={<IconRobot size={18} className="text-[#0F0F0F]" />}
      title="My Teacher's Lessons"
      subtitle="Assigned by your teacher"
      teacher
    />
  );
}
