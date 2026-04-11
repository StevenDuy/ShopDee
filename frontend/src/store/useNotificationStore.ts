import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface NotificationStore {
  unreadCount: number;
  hasUnreadNotifications: boolean;
  hasUnreadMessages: boolean;
  fetchUnreadCounts: (token: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  incrementMessages: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  hasUnreadNotifications: false,
  hasUnreadMessages: false,
  fetchUnreadCounts: async (token: string) => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ 
        unreadCount: res.data.total,
        hasUnreadNotifications: res.data.notifications > 0,
        hasUnreadMessages: res.data.messages > 0
      });
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementMessages: () => set(state => ({ 
    unreadCount: state.unreadCount + 1, 
    hasUnreadMessages: true 
  })),
}));
