"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useChatStore } from "@/store/useChatStore";

export function GlobalEventListener() {
  const { token, user } = useAuthStore();
  const { fetchUnreadCounts } = useNotificationStore();

  useEffect(() => {
    // Initial fetch when user logs in or app mounts
    if (token) {
      fetchUnreadCounts(token);
      useChatStore.getState().refreshData(token);
    }
  }, [token, fetchUnreadCounts]);

  const userId = user?.id;

  useEffect(() => {
    let activeChannel: any = null;
    let pollInterval: any = null;
    let globalSyncInterval: any = null;
    let pusherConnection: any = null;

    const handleInstantSync = () => {
      console.log("Connection restored. Performing instant catch-up sync...");
      if (token) {
        fetchUnreadCounts(token);
        useChatStore.getState().refreshData(token);
      }
    };

    const trySubscribe = () => {
      const echoInstance = typeof window !== 'undefined' ? window.Echo : null;
      if (!echoInstance) return false;

      const userChannel = echoInstance.private(`App.Models.User.${userId}`);
      activeChannel = userChannel;

      const handleGlobalUpdate = (e: any) => {
        console.log("Global Real-time Message Received:", e);
        // INSTANT: Directly increment unread UI state
        useNotificationStore.getState().incrementMessages();

        // INSTANT: Update Chat Store state
        if (userId && e.message) {
          useChatStore.getState().handleIncomingMessage(e.message, userId);
        }

        // Delay background sync slightly to prevent database transaction race conditions
        setTimeout(() => {
          if (token) fetchUnreadCounts(token);
        }, 2000);
      };

      const handleNotificationUpdate = (e: any) => {
        console.log("Global Real-time Notification Received:", e);
        // INSTANT: Optimistically increment the notification dot
        const store = useNotificationStore.getState();
        useNotificationStore.setState({
          unreadCount: store.unreadCount + 1,
          hasUnreadNotifications: true
        });

        // INSTANT: Update Chat Store state
        if (e.notification) {
          useChatStore.getState().handleIncomingNotification(e.notification);
        }

        // Delay background sync slightly to prevent database transaction race conditions
        setTimeout(() => {
          if (token) fetchUnreadCounts(token);
        }, 2000);
      };

      // Listen for messages (multiple event name formats for redundancy)
      userChannel.listen('.message.new', handleGlobalUpdate);
      userChannel.listen('message.new', handleGlobalUpdate);
      userChannel.listen('.NewChatMessage', handleGlobalUpdate);
      userChannel.listen('NewChatMessage', handleGlobalUpdate);

      // Listen for model-level notifications
      userChannel.listen('.notification.new', handleNotificationUpdate);
      userChannel.listen('notification.new', handleNotificationUpdate);
      userChannel.listen('.NotificationCreated', handleNotificationUpdate);
      userChannel.listen('NotificationCreated', handleNotificationUpdate);

      // Standard notifications (Laravel default notification system compatibility)
      userChannel.notification((notification: any) => {
         console.log("Global Laravel Notification Received:", notification);
         handleNotificationUpdate(notification);
       });

      // Bind connection states for instant sync on socket reconnect
      pusherConnection = (echoInstance as any)?.connector?.pusher?.connection;
      if (pusherConnection) {
        pusherConnection.bind('state_change', (states: any) => {
          if (states.current === 'connected') {
            handleInstantSync();
          }
        });
      }

      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      return true;
    };

    if (token && userId) {
      const success = trySubscribe();
      if (!success) {
        console.log("Echo not ready yet, polling for window.Echo...");
        pollInterval = setInterval(() => {
          if (trySubscribe()) {
            console.log("Echo loaded and subscribed successfully!");
          }
        }, 500);
      }

      // FAILSAFE POLLING: Every 30 seconds to guarantee dots appear regardless of socket state
      globalSyncInterval = setInterval(() => {
        if (token) {
          fetchUnreadCounts(token);
        }
      }, 30000);
    }

    window.addEventListener('online', handleInstantSync);

    return () => {
      if (activeChannel) {
        activeChannel.stopListening('.message.new');
        activeChannel.stopListening('message.new');
        activeChannel.stopListening('.NewChatMessage');
        activeChannel.stopListening('NewChatMessage');
        activeChannel.stopListening('.notification.new');
        activeChannel.stopListening('notification.new');
        activeChannel.stopListening('.NotificationCreated');
        activeChannel.stopListening('NotificationCreated');
        const echoInstance = typeof window !== 'undefined' ? window.Echo : null;
        if (echoInstance) {
          echoInstance.leave(`App.Models.User.${userId}`);
        }
      }
      if (pollInterval) clearInterval(pollInterval);
      if (globalSyncInterval) clearInterval(globalSyncInterval);
      window.removeEventListener('online', handleInstantSync);
      if (pusherConnection) {
        try {
          pusherConnection.unbind('state_change');
        } catch (e) {}
      }
    };
  }, [token, userId, fetchUnreadCounts]);

  return null;
}
