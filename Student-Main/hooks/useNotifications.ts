"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "@/features/student/hooks";

export function useNotificationSocket(userId: string | null) {
  const [connected, setConnected] = useState(false);
  const { refresh } = useNotifications();

  useEffect(() => {
    if (!userId) return;
    // Socket.io connection would go here
    setConnected(true);
    return () => setConnected(false);
  }, [userId]);

  const onNotification = useCallback(() => {
    refresh();
  }, [refresh]);

  return { connected, onNotification };
}
