"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Search, Send, Image as ImageIcon, CheckCheck, 
  Bell, MessageCircle, Package, CheckCircle, Info, Star, Store,
  ChevronLeft
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API = "http://localhost:8000/api";

const getNotifIcon = (type: string) => {
  if (type.includes("order")) return <Package size={18} />;
  if (type.includes("success")) return <CheckCircle size={18} />;
  if (type.includes("review")) return <Star size={18} />;
  return <Info size={18} />;
};

const getNotifColor = (type: string) => {
  if (type.includes("order")) return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  if (type.includes("success")) return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  if (type.includes("review")) return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-muted text-muted-foreground";
};

export function UnifiedInbox() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"chat" | "notifications">("chat");
  
  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New Message state
  const [isSearching, setIsSearching] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchConversations();
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (activeConv && token) {
      axios.get(`${API}/chat/${activeConv.id}`, { headers: { Authorization: `Bearer ${token}` } })
           .then(r => {
             setMessages(r.data.messages);
             setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
           });
    }
  }, [activeConv, token]);

  // Handle user search
  useEffect(() => {
    if (!isSearching || !token) return;
    const delayDebounceFn = setTimeout(() => {
      setLoadingUsers(true);
      axios.get(`${API}/chat/users?search=${userSearch}`, { headers: { Authorization: `Bearer ${token}` } })
           .then(r => setFoundUsers(r.data))
           .finally(() => setLoadingUsers(false));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearch, isSearching, token]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      setConversations(res.data);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data.data || []);
    } catch {}
  };

  const handleStartChat = async (targetUserId: number) => {
    try {
      const res = await axios.post(`${API}/chat/start`, { target_user_id: targetUserId }, { headers: { Authorization: `Bearer ${token}` } });
      const newConv = res.data;
      
      // Ensure other_user is populated for the UI
      if (!newConv.other_user) {
        const targetUser = foundUsers.find(u => u.id === targetUserId);
        newConv.other_user = targetUser;
      }

      setConversations(prev => {
        if (prev.find(c => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConv(newConv);
      setIsSearching(false);
      setUserSearch("");
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    try {
      const res = await axios.post(`${API}/chat/${activeConv.id}`, { message_text: newMessage }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error("Failed to send", e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await axios.put(`${API}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setNotifications(nots => nots.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await axios.put(`${API}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setNotifications(nots => nots.map(n => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-background">
      {/* Tab Switcher */}
      <div className="flex border-b border-border bg-card shrink-0 px-4">
        <button 
          onClick={() => { setActiveTab("chat"); setIsSearching(false); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <MessageCircle size={18} /> Chat
        </button>
        <button 
          onClick={() => { setActiveTab("notifications"); setIsSearching(false); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === "notifications" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Bell size={18} /> Notifications
          {notifications.some(n => !n.is_read) && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex h-full overflow-hidden">
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card transition-all ${activeConv || isSearching ? "hidden md:flex" : "flex"}`}>
              <div className="p-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button 
                  onClick={() => setIsSearching(true)}
                  className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors shrink-0"
                  title="New Message"
                >
                  <Star size={18} className="rotate-45" /> {/* Using Star as a stand-in for Plus with a flair */}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground text-sm opacity-50">
                    No conversations yet.
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button 
                      key={conv.id} 
                      onClick={() => { setActiveConv(conv); setIsSearching(false); }}
                      className={`w-full flex items-center gap-3 p-4 text-left border-b border-border/50 hover:bg-accent transition-colors ${activeConv?.id === conv.id ? "bg-accent" : ""}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {conv.other_user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm truncate">{conv.other_user?.name || "ShopDee User"}</p>
                          <span className="text-xs text-muted-foreground">
                            {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message?.message_text || "Attachment"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Content Area (Chat or Search) */}
            <div className={`flex-1 flex flex-col bg-background/50 ${(!activeConv && !isSearching) ? "hidden md:flex" : "flex"}`}>
              {isSearching ? (
                <div className="flex-1 flex flex-col">
                  {/* Search Header */}
                  <div className="p-4 border-b border-border flex items-center gap-3 bg-card shrink-0">
                    <button onClick={() => setIsSearching(false)} className="p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 relative">
                       <input 
                         autoFocus
                         type="text" 
                         value={userSearch}
                         onChange={(e) => setUserSearch(e.target.value)}
                         placeholder="Type a name to start chatting..." 
                         className="w-full pl-4 pr-10 py-2 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                       />
                       {loadingUsers && (
                         <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                         </div>
                       )}
                    </div>
                  </div>
                  
                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {foundUsers.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => handleStartChat(u.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-accent transition-all border border-transparent hover:border-border group"
                      >
                         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-105 transition-transform">
                           {u.name.charAt(0)}
                         </div>
                         <div className="flex-1 text-left">
                           <p className="font-bold text-foreground">{u.name}</p>
                           <p className="text-xs text-muted-foreground">{u.email}</p>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                           <MessageCircle size={16} />
                         </div>
                      </button>
                    ))}
                    {!loadingUsers && foundUsers.length === 0 && userSearch.length > 0 && (
                      <div className="p-20 text-center text-muted-foreground opacity-50">
                        No users found matching "{userSearch}"
                      </div>
                    )}
                    {!loadingUsers && foundUsers.length === 0 && userSearch.length === 0 && (
                      <div className="p-20 text-center text-muted-foreground opacity-50">
                        {user.role_id === 1 ? "Search for any user to start a conversation" : 
                         user.role_id === 2 ? "Search for a customer to message" : 
                         "Search for a seller to start chatting"}
                      </div>
                    )}
                  </div>
                </div>
              ) : !activeConv ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 opacity-30">
                  <MessageCircle size={80} className="mb-4" />
                  <h2 className="text-2xl font-bold">Your Messages</h2>
                  <p>Select a chat to start communicating</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border flex items-center gap-3 bg-card shrink-0">
                    <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {activeConv.other_user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{activeConv.other_user?.name || "User"}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                          key={msg.id || i} 
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card text-foreground border border-border rounded-tl-sm"}`}>
                            {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}
                            <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && <CheckCheck size={12} className={msg.is_read ? "text-blue-200" : ""} />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border shrink-0">
                    <div className="flex items-center gap-2 bg-muted border border-border rounded-2xl pr-2 pl-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <input 
                        type="text" 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Aa" 
                        className="flex-1 bg-transparent py-2 outline-none text-sm min-w-0"
                      />
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 shadow-sm"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Notifications Tab */
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Updates</h2>
              {notifications.some(n => !n.is_read) && (
                <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline font-bold">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-3xl opacity-50">
                  <Bell size={48} className="mx-auto mb-4" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    key={notif.id}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    className={`flex items-start gap-4 p-5 rounded-3xl border transition-all cursor-pointer group shadow-sm ${notif.is_read ? "bg-card border-border hover:bg-muted/50" : "bg-primary/5 border-primary/20 hover:bg-primary/10"}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${getNotifColor(notif.type)}`}>
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-sm ${!notif.is_read ? "text-foreground" : "text-foreground/70"}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!notif.is_read ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1 shadow-sm" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
