"use client";

import { useEffect } from "react";
import echo from "@/lib/echo";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

export function GlobalEventListener() {
  const { token, user } = useAuthStore();
  const { fetchUnreadCounts } = useNotificationStore();

  useEffect(() => {
    // Initial fetch when user logs in or app mounts
    if (token) {
      fetchUnreadCounts(token);
    }
  }, [token, fetchUnreadCounts]);

  useEffect(() => {
    if (!token || !user || !echo) return;

    const userChannel = echo.private(`App.Models.User.${user.id}`);

    const handleGlobalUpdate = (e: any) => {
      console.log("Global Real-time Message Received:", e);
      // INSTANT: Directly increment unread UI state
      useNotificationStore.getState().incrementMessages();
      // Then sync with server in background
      fetchUnreadCounts(token);
    };

    // Listen for messages (multiple event name formats for redundancy)
    userChannel.listen('.message.new', handleGlobalUpdate);
    userChannel.listen('message.new', handleGlobalUpdate);
    userChannel.listen('.NewChatMessage', handleGlobalUpdate);
    userChannel.listen('NewChatMessage', handleGlobalUpdate);

    // Standard notifications
    userChannel.notification((notification: any) => {
       console.log("Global Notification Received:", notification);
       fetchUnreadCounts(token);
    });

    // FAILSAFE POLLING: Every 5 seconds to guarantee dots appear regardless of socket state
    const globalSyncInterval = setInterval(() => {
      if (token) {
        fetchUnreadCounts(token);
      }
    }, 5000);

    return () => {
      userChannel.stopListening('.message.new');
      userChannel.stopListening('message.new');
      userChannel.stopListening('.NewChatMessage');
      userChannel.stopListening('NewChatMessage');
      clearInterval(globalSyncInterval);
    };
  }, [token, user, echo, fetchUnreadCounts]);

  return null;
}
