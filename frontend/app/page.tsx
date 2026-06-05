"use client";

import { Dashboard } from "@/components/Dashboard";
import { AuthGate } from "@/components/Auth/AuthGate";

export default function HomePage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
