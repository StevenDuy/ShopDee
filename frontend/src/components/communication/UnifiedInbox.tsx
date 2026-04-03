"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
  Search, Send, Image as ImageIcon, CheckCheck,
  Bell, MessageCircle, Package, CheckCircle, Info, Star, Store,
  ChevronLeft, Plus, X, Trash2, FileText, Link as LinkIcon,
  MoreVertical, User, ShieldAlert
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import echo from "@/lib/echo";

import imageCompression from "browser-image-compression";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const getNotifIcon = (type: string) => {
  if (type.includes("order")) return <Package size={20} />;
  if (type.includes("success")) return <CheckCircle size={20} />;
  if (type.includes("review")) return <Star size={20} />;
  return <Info size={20} />;
};

const getNotifColor = (type: string) => {
  if (type.includes("order")) return "bg-blue-500/10 text-blue-500";
  if (type.includes("success")) return "bg-green-500/10 text-green-500";
  if (type.includes("review")) return "bg-amber-500/10 text-amber-500";
  return "bg-slate-500/10 text-slate-500";
};

const getNotifBadgeVariant = (type: string) => {
  if (type.includes("order")) return "outline";
  if (type.includes("success")) return "secondary";
  if (type.includes("review")) return "outline";
  return "outline";
};

export function UnifiedInbox() {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"chat" | "notifications">("chat");
  const isAdmin = user?.role_id === 1;

  const { unreadCount, hasUnreadMessages, hasUnreadNotifications, fetchUnreadCounts } = useNotificationStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserId = searchParams.get("userId");

  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, has_more: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ title: "", message: "", link: "", role: "all" });
  const [isDeletingConv, setIsDeletingConv] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [isAttachingProduct, setIsAttachingProduct] = useState(false);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (activeConv || selectedNotif) {
      document.body.classList.add("hide-mobile-menu");
    } else {
      document.body.classList.remove("hide-mobile-menu");
    }
    return () => document.body.classList.remove("hide-mobile-menu");
  }, [activeConv, selectedNotif]);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [selectedNotif]);

  useEffect(() => {
    if (!token) return;
    refreshData().then(() => {
      if (targetUserId && activeTab === "chat") {
        handleStartChat(parseInt(targetUserId));
      }
    });

    // Handle auto-attaching product from URL
    const productId = searchParams.get("productId");
    if (productId) {
      setSelectedProductId(parseInt(productId));
    }
  }, [token, activeTab, targetUserId, searchParams]);

  useEffect(() => {
    if (activeConv && token) {
      fetchMessages(activeConv.id, 1).then(() => fetchUnreadCounts(token));
    }
  }, [activeConv, token]);

  useEffect(() => {
    if (!activeConv || !token || !echo) return;

    const channel = echo!.private(`chat.${activeConv.id}`);

    channel.listen('.App\\Events\\NewChatMessage', (e: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === e.message.id)) return prev;
        return [...prev, e.message];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => {
      echo!.leave(`chat.${activeConv.id}`);
    };
  }, [activeConv, token]);

  const refreshData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [convRes, notifRes] = await Promise.all([
        axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setConversations(convRes.data || []);
      setNotifications(notifRes.data.data || notifRes.data || []);

      await fetchUnreadCounts(token);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: number, page = 1) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    const container = scrollContainerRef.current;
    const oldScrollHeight = container?.scrollHeight || 0;

    try {
      const res = await axios.get(`${API}/chat/${id}?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
      const newMessages = [...res.data.messages].reverse();

      if (page === 1) {
        setMessages(newMessages);
        setPagination(res.data.pagination);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setPagination(res.data.pagination);

        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }
        }, 0);
      }
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (!token) return;
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
      fetchUnreadCounts(token);
    } catch { }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await axios.get(`${API}/chat/users?search=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(res.data);
    } catch (e) { console.error(e); }
  };

  const handleStartChat = async (tid: number) => {
    try {
      const res = await axios.post(`${API}/chat/start`, { target_user_id: tid }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveConv(res.data);
      setIsSearching(false);
      setSearchQuery("");
      refreshData();
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent, mediaUrl?: string, file?: File) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !mediaUrl && !file && !selectedProductId || !activeConv || !token) return;

    const msgText = newMessage;
    const prodId = selectedProductId;
    setNewMessage("");
    setSelectedProductId(null);
    setIsAttachingProduct(false);

    try {
      const formData = new FormData();
      if (msgText.trim()) formData.append("message_text", msgText);
      if (mediaUrl) formData.append("media_url", mediaUrl);
      if (file) formData.append("file", file);
      if (prodId) formData.append("product_id", prodId.toString());

      const optimisticId = Date.now();
      if (!user) return;
      const tempMsg = {
        id: optimisticId,
        sender_id: user.id,
        message_text: msgText,
        media_url: file ? URL.createObjectURL(file) : mediaUrl,
        product_id: prodId,
        created_at: new Date().toISOString(),
        is_optimistic: true
      };
      setMessages(prev => [...prev, tempMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      const res = await axios.post(`${API}/chat/${activeConv.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setMessages(prev => prev.map(m => m.id === optimisticId ? res.data : m));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      console.error("Chat Error Detail:", err.response?.data || err.message || err);
      toast.error(t("common.error_send_message") || "Lỗi gửi tin nhắn");
    }
  };

  const handleDeleteConversation = async (convId: number) => {
    try {
      await axios.delete(`${API}/chat/conversations/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t("inbox.conversation_deleted") || "Đã xóa cuộc hội thoại");
      setActiveConv(null);
      setIsDeletingConv(false);
      refreshData();
    } catch (err) {
      console.error(err);
      toast.error(t("inbox.error_delete_conversation") || "Lỗi xóa cuộc hội thoại");
    }
  };

  const fetchShopProducts = async () => {
    if (!activeConv || !token) return;
    const sellerId = user?.role_id === 2 ? user.id : activeConv.other_user?.id;
    if (!sellerId) return;

    try {
      const res = await axios.get(`${API}/chat/shop-products/${sellerId}`, { headers: { Authorization: `Bearer ${token}` } });
      setShopProducts(res.data);
      setIsAttachingProduct(true);
    } catch (err) {
      console.error(err);
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      await handleSendMessage(null as any, undefined, compressedFile);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (form.link && !/^(https?:\/\/)/i.test(form.link)) {
      toast.error(t("inbox.invalid_link"));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/notifications`, {
        title: form.title,
        message: form.message,
        link: form.link,
        role: form.role
      }, { headers: { Authorization: `Bearer ${token}` } });

      setForm({ title: "", message: "", link: "", role: "all" });
      setShowCreateModal(false);
      refreshData();
      toast.success(t("inbox.broadcast_success"));
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 422) {
        toast.error(t("inbox.invalid_link"));
      } else {
        toast.error(t("inbox.error_broadcast"));
      }
    }
    finally { setLoading(false); }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!isAdmin) return;
    try {
      await axios.delete(`${API}/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedNotif?.id === id) setSelectedNotif(null);
      setIsConfirmingDelete(false);
      fetchUnreadCounts(token!);
    } catch (e) {
      console.error(e);
      toast.error(t("inbox.error_delete_notification") || "Lỗi xóa thông báo");
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row bg-background w-full h-full overflow-hidden border border-border/50 shadow-sm rounded-[inherit]">

      {/* 1. Sidebar Control (Desktop) - Standardized Flat-Zoom */}
      <div className="hidden md:flex w-[80px] border-r border-border/50 flex-col items-center py-8 gap-8 bg-card shrink-0">
        <button
          onClick={() => { setActiveTab("chat"); setSelectedNotif(null); setActiveConv(null); }}
          className={`p-4 rounded-[22px] transition-all duration-300 relative group active:scale-95 hover:scale-110 ${activeTab === "chat" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <MessageCircle size={24} />
          {hasUnreadMessages && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase tracking-widest border border-border/50">
            {t("inbox.messages")}
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }}
          className={`p-4 rounded-[22px] transition-all duration-300 relative group active:scale-95 hover:scale-110 ${activeTab === "notifications" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Bell size={24} />
          {hasUnreadNotifications && !isAdmin && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-background text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase tracking-widest border border-border/50">
            {t("inbox.notifications")}
          </div>
        </button>
      </div>

      {/* 2. List Pane */}
      <div className={`w-full md:w-[380px] flex-1 md:flex-none border-r border-border/50 flex flex-col bg-card shrink-0 transition-all ${(activeConv || selectedNotif) ? "hidden md:flex" : "flex"}`}>
        <div className="p-6 border-b border-border/50 bg-muted/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="hidden md:block text-2xl font-black tracking-tight uppercase text-foreground">{activeTab === "chat" ? t("inbox.title_chat") : t("inbox.title_updates")}</h2>
            {activeTab === "notifications" && isAdmin && (
              <Button size="icon" onClick={() => setShowCreateModal(true)} className="w-10 h-10 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all">
                <Plus size={18} strokeWidth={3} />
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={18} />
            <Input
              placeholder={activeTab === "chat" ? t("inbox.search_chat") : t("inbox.filter_alerts")}
              value={searchQuery}
              className="pl-12 h-14 bg-muted/20 border-transparent focus:bg-background rounded-xl"
              onChange={(e) => activeTab === "chat" ? handleSearchUsers(e.target.value) : setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-card/50">
          {loading && notifications.length === 0 && conversations.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
            </div>
          ) : activeTab === "chat" ? (
            <div className="divide-y divide-border/10">
              {isSearching && searchResults.length > 0 && (
                <div className="bg-primary/5 p-4 border-b border-border/20">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 px-2">{t("inbox.people")}</p>
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => handleStartChat(u.id)} className="w-full p-3 flex items-center gap-3 hover:bg-card border border-transparent hover:border-border/50 rounded-xl transition-all shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-lg">{u.name.charAt(0)}</div>
                      <span className="text-sm font-black uppercase tracking-tight text-foreground">{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => setActiveConv(conv)} className={`w-full p-5 flex items-center gap-4 hover:bg-muted/30 transition-all text-left ${activeConv?.id === conv.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"}`}>
                  <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center font-black shrink-0 overflow-hidden shadow-sm">
                    {conv.other_user?.profile_image ? <img src={conv.other_user.profile_image} className="w-full h-full object-cover" /> : conv.other_user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-xs uppercase tracking-tight truncate text-foreground">{conv.other_user?.name || t("admin.user")}</p>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">{conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium opacity-80">{conv.last_message?.message_text || t("inbox.say_something")}</p>
                    {conv.unread_count > 0 && <div className="mt-2 h-1.5 w-full bg-primary rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {notifications.map(n => (
                <button key={n.id} onClick={() => { setSelectedNotif(n); if (!n.is_read) handleMarkAsRead(n.id); }} className={`w-full p-6 flex gap-4 hover:bg-muted/30 transition-all text-left ${selectedNotif?.id === n.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"} ${n.is_read ? "opacity-60" : ""}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-border/50 shadow-sm ${n.is_read ? 'bg-muted/20' : 'bg-background'}`}>
                    <div className={isAdmin ? 'text-primary' : (n.is_read ? 'text-muted-foreground' : 'text-primary')}>
                      {getNotifIcon(n.type || "info")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs uppercase tracking-tight text-foreground truncate">{n.data?.title || n.title || "Note"}</p>
                    {isAdmin && (n as any).user && (
                      <p className="text-[9px] font-black text-primary/60 mt-1 uppercase tracking-widest opacity-80">
                        {t("admin.recipient") || "Người nhận"}: {(n as any).user.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 font-medium leading-relaxed">{n.data?.message || n.message}</p>
                  </div>
                  {!n.is_read && !isAdmin && <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center animate-pulse" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Detail Pane */}
      <div className={`flex-1 bg-muted/5 relative flex flex-col min-w-0 ${(activeConv || selectedNotif) ? "flex" : "hidden md:flex"}`}>
        <AnimatePresence mode="wait">
          {activeConv ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full bg-background fixed md:absolute inset-0 md:relative z-[310] md:z-20">
              {/* Chat Header */}
              <div className="p-5 border-b border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setActiveConv(null)} className="md:hidden">
                    <ChevronLeft size={24} />
                  </Button>
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center font-black text-primary shadow-sm text-lg">
                    {activeConv.other_user?.name?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-black text-sm uppercase tracking-tight leading-none text-foreground">{activeConv.other_user?.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">{t("inbox.online") || "Online"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isDeletingConv ? (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setIsDeletingConv(true)}
                      className="w-10 h-10 rounded-xl shadow-sm"
                      title={t("inbox.delete_conversation")}
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteConversation(activeConv.id)}
                        className="px-4 h-10 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
                      >
                        {t("inbox.confirm") || "XÓA VĨNH VIỄN"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDeletingConv(false)}
                        className="px-4 h-10 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                      >
                        {t("inbox.cancel_short") || "HỦY"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {viewingImage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-background/95 backdrop-blur-2xl" onClick={() => setViewingImage(null)}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                      <img src={viewingImage} alt="Fullscreen" className="w-full h-auto max-h-[80vh] object-contain rounded-[2rem] shadow-2xl border border-border/20" />
                      <div className="absolute top-6 right-6 flex gap-3">
                        <Button size="icon" className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border-white/10" onClick={() => window.open(viewingImage, '_blank')}><LinkIcon size={20} /></Button>
                        <Button size="icon" className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border-white/10" onClick={() => setViewingImage(null)}><X size={20} /></Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message List */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar flex flex-col bg-muted/5 shadow-inner"
              >
                {pagination.has_more && (
                  <button
                    onClick={() => fetchMessages(activeConv.id, pagination.current_page + 1)}
                    disabled={loadingMore}
                    className="self-center px-6 py-2 rounded-full border border-border/50 bg-background text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-all shadow-sm hover:scale-105 active:scale-95"
                  >
                    {loadingMore ? t("inbox.loading") : t("inbox.load_older")}
                  </button>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-none border ${isMe ? "bg-primary text-primary-foreground border-primary rounded-tr-none" : "bg-card border-border/50 rounded-tl-none"}`}>
                        {msg.media_url && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-muted/20 group relative shadow-sm">
                            <img
                              src={msg.media_url}
                              alt="media"
                              className="max-w-full h-auto object-cover hover:scale-105 transition-all duration-700 cursor-pointer"
                              onClick={() => setViewingImage(msg.media_url)}
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/20"><Search className="text-white" size={24} strokeWidth={3} /></div>
                            </div>
                          </div>
                        )}
                        {msg.product && (
                          <div
                            onClick={() => {
                              if (user?.role_id === 2 || user?.role_id === 1) {
                                router.push(`/seller/products?search=${encodeURIComponent(msg.product.title)}`);
                              } else {
                                router.push(`/products/${msg.product.slug}`);
                              }
                            }}
                            className={`mb-3 p-3 rounded-xl border flex gap-4 cursor-pointer transition-all hover:bg-opacity-80 active:scale-[0.98] ${isMe ? "bg-white/10 border-white/20" : "bg-muted/30 border-border/50"}`}
                          >
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0 border border-black/5 dark:border-white/5 bg-background shadow-sm">
                              <img src={msg.product.media?.[0]?.url || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="text-[11px] font-black uppercase tracking-tight leading-tight line-clamp-1">{msg.product.title}</p>
                              <p className={`text-[10px] font-black mt-2 inline-block px-2 py-0.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                {msg.product.price?.toLocaleString()} đ
                              </p>
                            </div>
                          </div>
                        )}
                        {msg.message_text && <p className="text-sm leading-relaxed font-medium">{msg.message_text}</p>}
                        <div className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${isMe ? "justify-end" : ""}`}>
                          {isMe && <CheckCheck size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-5 bg-card border-t border-border/50 flex flex-col gap-4 shadow-sm z-50">
                {selectedProductId && (
                  <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-2xl relative border border-primary/20 animate-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border/50 shrink-0 shadow-sm">
                      <Package size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-tight text-foreground line-clamp-1">{t("inbox.product_attached")}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID #{selectedProductId}</p>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => setSelectedProductId(null)} className="w-7 h-7 rounded-full shadow-lg active:scale-95"><X size={14} strokeWidth={4} /></Button>
                  </div>
                )}

                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground cursor-pointer transition-all active:scale-90 ${uploading ? "animate-pulse" : ""}`}>
                      <Badge variant="ghost" className="p-0 border-0"><ImageIcon size={22} /></Badge>
                      <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} disabled={uploading} />
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={fetchShopProducts} className="w-12 h-12 rounded-2xl bg-muted/40 hover:bg-muted active:scale-90">
                      <Package size={22} />
                    </Button>
                  </div>

                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={uploading ? t("inbox.loading") : t("inbox.say_something")}
                    disabled={uploading}
                    className="flex-1 h-14 bg-muted/20 border-transparent focus:bg-background rounded-2xl md:px-6 shadow-none text-sm font-medium"
                  />

                  <Button type="submit" size="icon" disabled={(!newMessage.trim() && !uploading && !selectedProductId) || uploading} className="w-14 h-14 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <Send size={24} strokeWidth={2.5} />
                  </Button>
                </div>

                <AnimatePresence>
                  {isAttachingProduct && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/60 backdrop-blur-2xl">
                      <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="bg-card w-full max-w-2xl border border-border/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                          <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">{t("inbox.attach_product") || "CHỌN SẢN PHẨM"}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">{t("inbox.select_desc") || "Tìm kiếm và đính kèm vào tin nhắn"}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setIsAttachingProduct(false)} className="w-12 h-12 rounded-full hover:bg-muted active:scale-95"><X size={24} strokeWidth={3} /></Button>
                        </div>

                        <div className="p-6 bg-muted/10 border-b border-border/50">
                          <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                            <Input
                              autoFocus
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder={t("inbox.search_product_placeholder") || "Tìm kiếm sản phẩm theo tên..."}
                              className="w-full pl-14 h-14 bg-background border-border/30 rounded-2xl text-sm font-bold shadow-none"
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {shopProducts.filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => { setSelectedProductId(p.id); setIsAttachingProduct(false); setProductSearch(""); }}
                                className="group p-3 flex flex-col gap-3 hover:bg-primary/5 rounded-[1.5rem] transition-all text-left border border-transparent hover:border-primary/20 bg-muted/10"
                              >
                                <div className="aspect-square w-full rounded-2xl bg-background overflow-hidden shrink-0 border border-border/50 group-hover:shadow-lg transition-all">
                                  <img src={p.media?.[0]?.url || 'https://via.placeholder.com/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="px-1">
                                  <p className="text-[10px] font-black uppercase tracking-tight truncate text-foreground">{p.title}</p>
                                  <Badge variant="outline" className="mt-2 font-black text-[9px] bg-primary/10 text-primary border-primary/20">
                                    {p.price?.toLocaleString()} đ
                                  </Badge>
                                </div>
                              </button>
                            ))}
                            {shopProducts.filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                              <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-20">
                                <Package size={64} strokeWidth={1} />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">{t("inbox.no_products")}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-border/50 flex justify-end">
                          <Button variant="outline" onClick={() => setIsAttachingProduct(false)} className="px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">{t("inbox.close") || "ĐÓNG LẠI"}</Button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          ) : selectedNotif ? (
            <motion.div key="notif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full bg-background overflow-y-auto fixed md:absolute inset-0 md:relative z-[310] md:z-20 p-6 md:p-20 shadow-inner">
              {/* Notification Detail */}
              <Button variant="ghost" size="icon" onClick={() => setSelectedNotif(null)} className="absolute top-8 left-8 w-12 h-12 bg-muted/50 rounded-full active:scale-90">
                <ChevronLeft size={24} strokeWidth={3} />
              </Button>

              <div className="max-w-2xl mx-auto w-full pt-16 md:pt-0">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center mb-10 shadow-xl border border-white/20 ${getNotifColor(selectedNotif.type || "system")}`}>
                  {getNotifIcon(selectedNotif.type || "system")}
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-tight mb-8">
                  {selectedNotif.data?.title || selectedNotif.title}
                </h1>
                <div className="flex items-center gap-3 mb-10 pb-8 border-b border-border/50">
                  <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest px-4 py-1.5 opacity-60">
                    {t("inbox.sent_on")} {new Date(selectedNotif.created_at).toLocaleString()}
                  </Badge>
                </div>

                <div className="text-lg md:text-xl leading-relaxed text-foreground/70 font-medium whitespace-pre-wrap mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {selectedNotif.data?.message || selectedNotif.message}
                </div>

                {(selectedNotif.data?.link || selectedNotif.link) && (
                  <Button asChild className="w-full h-16 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <a href={selectedNotif.data?.link || selectedNotif.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3">
                      <span className="font-black uppercase tracking-widest text-sm">{t("inbox.take_action")}</span>
                      <LinkIcon size={20} strokeWidth={3} />
                    </a>
                  </Button>
                )}

                {isAdmin && (
                  <div className="mt-20 pt-10 border-t border-border/50 flex flex-col items-center gap-6">
                    {!isConfirmingDelete ? (
                      <Button
                        variant="destructive"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex items-center gap-2 px-8 h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-md"
                      >
                        <Trash2 size={16} strokeWidth={3} /> {t("inbox.delete")}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-4 animate-in zoom-in-95">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteNotification(selectedNotif.id)}
                          className="px-10 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95"
                        >
                          {t("inbox.confirm") || "XÓA QUẢNG BÁ"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-10 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest"
                        >
                          {t("inbox.cancel_short") || "HỦY"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/10 p-10 select-none animate-in fade-in duration-1000">
              <Store size={200} strokeWidth={0.5} />
              <h2 className="text-3xl font-black mt-8 uppercase tracking-widest opacity-40">{t("inbox.unified_title")}</h2>
              <div className="w-12 h-1 bg-primary/20 rounded-full mt-4"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] mt-6 opacity-30">{t("inbox.selection_required")}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Bottom Tab Control (Mobile Only) */}
      <div className="md:hidden grid grid-cols-2 border-t border-border/50 bg-card p-3 gap-3 shrink-0 z-50 sticky bottom-0">
        <Button
          variant={activeTab === "chat" ? "default" : "ghost"}
          onClick={() => { setActiveTab("chat"); setSelectedNotif(null); setActiveConv(null); }}
          className="h-16 flex-col gap-1 rounded-2xl"
        >
          <div className="relative">
            <MessageCircle size={22} strokeWidth={activeTab === "chat" ? 3 : 2} />
            {hasUnreadMessages && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">{t("inbox.messages")}</span>
        </Button>
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }}
          className="h-16 flex-col gap-1 rounded-2xl"
        >
          <div className="relative">
            <Bell size={22} strokeWidth={activeTab === "notifications" ? 3 : 2} />
            {hasUnreadNotifications && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">{t("inbox.notifications")}</span>
        </Button>
      </div>

      {/* Broadcast Modal - Standardized Flat-Zoom */}
      <AnimatePresence>
        {isAdmin && showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="bg-card w-full max-w-xl border border-border/50 shadow-2xl rounded-[3rem] overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-border/50 bg-primary/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase px-2 text-foreground">{t("inbox.new_broadcast")}</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 ml-2 mt-1">GỬI THÔNG BÁO CHO HỆ THỐNG</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-full active:scale-95"><X size={24} strokeWidth={3} /></Button>
              </div>
              <form onSubmit={handleCreateNotification} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.headline")}</label>
                  <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="..." className="h-14 bg-muted/20 border-transparent focus:bg-background rounded-2xl text-sm font-bold shadow-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.target_role") || "ĐỐI TƯỢNG NHẬN"}</label>
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full h-14 px-6 bg-muted/20 border border-transparent rounded-2xl outline-none focus:bg-background focus:border-primary/20 text-sm appearance-none cursor-pointer font-bold shadow-none transition-all"
                    >
                      <option value="all">{t("inbox.role_all") || "🔊 Tất cả mọi người"}</option>
                      <option value="customer">{t("inbox.role_customer") || "👥 Khách hàng"}</option>
                      <option value="seller">{t("inbox.role_seller") || "🏪 Người bán / Shop"}</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"><Package size={16} /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.action_link")}</label>
                  <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." className="h-14 bg-muted/20 border-transparent focus:bg-background rounded-2xl text-sm font-bold shadow-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.message_body")}</label>
                  <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="..." className="w-full p-6 bg-muted/20 border border-transparent focus:bg-background focus:border-primary/20 rounded-[2rem] outline-none resize-none text-sm font-medium transition-all shadow-none" />
                </div>

                <div className="pt-6 flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 h-14 font-black rounded-2xl text-xs uppercase tracking-widest">{t("inbox.cancel")}</Button>
                  <Button disabled={loading || !form.title || !form.message} className="flex-[2] h-14 font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest transition-all">
                    {loading ? "SENDING..." : t("inbox.broadcast")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        body.hide-mobile-menu #mobile-hamburger { display: none !important; }
      `}</style>
    </div>
  );
}
