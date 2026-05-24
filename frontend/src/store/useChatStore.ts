import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface ChatState {
  conversations: any[];
  messagesCache: Record<number, { messages: any[]; pagination: any }>;
  activeConv: any | null;
  notifications: any[];
  selectedNotif: any | null;
  activeTab: 'chat' | 'notifications';
  loadingConversations: boolean;
  loadingMessages: boolean;
  
  setConversations: (conversations: any[]) => void;
  setActiveConv: (conv: any | null) => void;
  setNotifications: (notifications: any[]) => void;
  setSelectedNotif: (notif: any | null) => void;
  setActiveTab: (tab: 'chat' | 'notifications') => void;
  
  refreshData: (token: string) => Promise<void>;
  fetchMessages: (token: string, conversationId: number, page?: number) => Promise<void>;
  
  // Real-time Event Handlers (for global integration)
  handleIncomingMessage: (msg: any, currentUserId: number) => void;
  handleIncomingNotification: (notif: any) => void;
  clearActiveConvUnread: (token: string, conversationId: number) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesCache: {},
  activeConv: null,
  notifications: [],
  selectedNotif: null,
  activeTab: 'chat',
  loadingConversations: false,
  loadingMessages: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConv: (activeConv) => set({ activeConv }),
  setNotifications: (notifications) => set({ notifications }),
  setSelectedNotif: (selectedNotif) => set({ selectedNotif }),
  setActiveTab: (activeTab) => set({ activeTab }),

  refreshData: async (token) => {
    if (!token) return;
    const hasData = get().conversations.length > 0 || get().notifications.length > 0;
    if (!hasData) set({ loadingConversations: true });
    
    try {
      const [convRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      set({
        conversations: convRes.data || [],
        notifications: notifRes.data.data || notifRes.data || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loadingConversations: false });
    }
  },

  fetchMessages: async (token, conversationId, page = 1) => {
    const isFirstPage = page === 1;
    const cache = get().messagesCache;
    
    if (isFirstPage) {
      // If we don't have this conversation in cache, set loadingMessages to true
      if (!cache[conversationId]) {
        set({ loadingMessages: true });
      }
    }

    try {
      const res = await axios.get(`${API_URL}/chat/${conversationId}?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newMessages = [...res.data.messages].reverse();

      const existingCached = cache[conversationId] || { messages: [], pagination: {} };
      
      let updatedMessages;
      if (isFirstPage) {
        updatedMessages = newMessages;
      } else {
        // Prepend old loaded pages
        updatedMessages = [...newMessages, ...existingCached.messages];
      }

      // Filter duplicates in case real-time messages were appended
      const seen = new Set();
      const uniqueMessages = updatedMessages.filter(m => {
        const key = m.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const updatedCache = {
        ...cache,
        [conversationId]: {
          messages: uniqueMessages,
          pagination: res.data.pagination
        }
      };

      set({
        messagesCache: updatedCache,
        loadingMessages: false
      });
    } catch (e) {
      console.error(e);
      set({ loadingMessages: false });
    }
  },

  handleIncomingMessage: (msg, currentUserId) => {
    const msgConvId = Number(msg.conversation_id);
    const { conversations, activeConv, messagesCache } = get();
    
    // 1. Update Conversation list
    const updatedConversations = [...conversations];
    const idx = updatedConversations.findIndex(c => Number(c.id) === msgConvId);
    const isAtThisConv = activeConv && Number(activeConv.id) === msgConvId;

    if (idx !== -1) {
      updatedConversations[idx] = {
        ...updatedConversations[idx],
        last_message: msg,
        updated_at: msg.created_at,
        unread_count: isAtThisConv ? 0 : (Number(updatedConversations[idx].unread_count || 0) + 1)
      };
      // Move to top
      const item = updatedConversations[idx];
      const others = updatedConversations.filter((_, i) => i !== idx);
      set({ conversations: [item, ...others] });
    } else {
      // Refresh to fetch new conversation list
      const token = useAuthStore.getState().token;
      if (token) get().refreshData(token);
    }

    // 2. Update Messages Cache
    const cached = messagesCache[msgConvId] || { messages: [], pagination: { current_page: 1, last_page: 1, has_more: false } };
    if (!cached.messages.some(m => m.id === msg.id)) {
      // Remove optimistic duplicate if exists
      const filtered = cached.messages.filter(m => !(m.is_optimistic && m.sender_id === msg.sender_id && m.message_text === msg.message_text));
      const updatedMessages = [...filtered, msg].sort((a, b) => Number(a.id) - Number(b.id));
      
      set({
        messagesCache: {
          ...messagesCache,
          [msgConvId]: {
            ...cached,
            messages: updatedMessages
          }
        }
      });
    }
  },

  handleIncomingNotification: (notif) => {
    const { notifications } = get();
    if (notifications.some(n => n.id === notif.id)) return;
    set({ notifications: [notif, ...notifications] });
  },

  clearActiveConvUnread: async (token, conversationId) => {
    const { conversations } = get();
    const targetConv = conversations.find(c => Number(c.id) === Number(conversationId));
    if (targetConv && Number(targetConv.unread_count || 0) > 0) {
      // Optimistically clear in list
      const updated = conversations.map(c => Number(c.id) === Number(conversationId) ? { ...c, unread_count: 0 } : c);
      set({ conversations: updated });
      
      try {
        await axios.get(`${API_URL}/chat/${conversationId}?page=1`, { headers: { Authorization: `Bearer ${token}` } });
        // Fetch new global unread counts
        useNotificationStore.getState().fetchUnreadCounts(token);
      } catch (e) {
        console.error(e);
      }
    }
  }
}));
