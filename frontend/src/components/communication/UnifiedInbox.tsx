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
      // Always fetch both for consistent indicator dots
      const [convRes, notifRes] = await Promise.all([
        axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setConversations(convRes.data || []);
      setNotifications(notifRes.data.data || notifRes.data || []);
      
      // Update global store
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
    } catch {}
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if(q.length < 2) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await axios.get(`${API}/chat/users?search=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(res.data);
    } catch(e) { console.error(e); }
  };

  const handleStartChat = async (tid: number) => {
    try {
      const res = await axios.post(`${API}/chat/start`, { target_user_id: tid }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveConv(res.data);
      setIsSearching(false);
      setSearchQuery("");
      refreshData();
    } catch(e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent, mediaUrl?: string, file?: File) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !mediaUrl && !file && !selectedProductId || !activeConv || !token) return;
    
    // Optimistic clear
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
    } catch(err) {
      console.error(err);
      toast.error(t("inbox.error_delete_conversation") || "Lỗi xóa cuộc hội thoại");
    }
  };

  const fetchShopProducts = async () => {
    if (!activeConv || !token) return;
    // For customers, the seller is the other user. For sellers, they are themselves.
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
      // 1. Frontend Compression
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      // 2. Call sendMessage which uploads to Cloudinary via Backend
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
    
    // Simple URL validation if not empty
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
    } catch (e) { console.error(e); }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row bg-background w-full h-full overflow-hidden border border-border/50 shadow-2xl rounded-[inherit]">
      
      {/* 1. Sidebar Control (Desktop) */}
      <div className="hidden md:flex w-[80px] border-r border-border/50 flex-col items-center py-8 gap-8 bg-card shrink-0">
        <button 
          onClick={() => { setActiveTab("chat"); setSelectedNotif(null); setActiveConv(null); }}
          className={`p-4 rounded-[22px] transition-all duration-300 relative group ${activeTab === "chat" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30" : "text-muted-foreground hover:bg-muted"}`}
        >
          <MessageCircle size={24} />
          {hasUnreadMessages && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
          <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase">{t("inbox.messages")}</div>
        </button>
        <button 
          onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }}
          className={`p-4 rounded-[22px] transition-all duration-300 relative group ${activeTab === "notifications" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Bell size={24} />
          {hasUnreadNotifications && !isAdmin && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
          <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase">{t("inbox.notifications")}</div>
        </button>
      </div>

      {/* 2. List Pane */}
      <div className={`w-full md:w-[380px] flex-1 md:flex-none border-r border-border/50 flex flex-col bg-card shrink-0 transition-all ${ (activeConv || selectedNotif) ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 md:p-6 border-b border-border/50">
           <div className="flex items-center justify-between mb-4 md:mb-6">
             <h2 className="hidden md:block text-xl md:text-2xl font-black tracking-tighter uppercase">{activeTab === "chat" ? t("inbox.title_chat") : t("inbox.title_updates")}</h2>
             {activeTab === "notifications" && isAdmin && (
               <button onClick={() => setShowCreateModal(true)} className="w-8 h-8 md:w-10 md:h-10 bg-primary text-primary-foreground rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                 <Plus size={18} />
               </button>
             )}
           </div>
           
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
             <input 
               type="text" 
               placeholder={activeTab === "chat" ? t("inbox.search_chat") : t("inbox.filter_alerts")}
               value={searchQuery}
               className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-muted/40 rounded-xl md:rounded-2xl text-sm font-medium outline-none border border-transparent focus:border-primary/30 transition-all"
               onChange={(e) => activeTab === "chat" ? handleSearchUsers(e.target.value) : setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {loading && notifications.length === 0 && conversations.length === 0 ? (
             <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30"><div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div></div>
           ) : activeTab === "chat" ? (
             <div className="divide-y divide-border/10">
               {isSearching && searchResults.length > 0 && (
                 <div className="bg-primary/5 p-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{t("inbox.people")}</p>
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => handleStartChat(u.id)} className="w-full p-3 flex items-center gap-3 hover:bg-primary/10 rounded-xl transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{u.name.charAt(0)}</div>
                        <span className="text-sm font-bold">{u.name}</span>
                      </button>
                    ))}
                 </div>
               )}
               {conversations.map(conv => (
                 <button key={conv.id} onClick={() => setActiveConv(conv)} className={`w-full p-4 md:p-5 flex items-center gap-4 hover:bg-muted/50 transition-all text-left ${activeConv?.id === conv.id ? "bg-primary/5 border-l-4 border-primary" : ""}`}>
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-muted flex items-center justify-center font-bold shrink-0 overflow-hidden">
                     {conv.other_user?.profile_image ? <img src={conv.other_user.profile_image} className="w-full h-full object-cover" /> : conv.other_user?.name?.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                       <p className="font-bold text-sm truncate">{conv.other_user?.name || t("admin.user")}</p>
                       <span className="text-[9px] text-muted-foreground">{conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString() : ""}</span>
                     </div>
                     <p className="text-[11px] md:text-xs text-muted-foreground truncate">{conv.last_message?.message_text || t("inbox.say_something")}</p>
                     {conv.unread_count > 0 && <div className="mt-1 w-2 h-2 rounded-full bg-primary" />}
                   </div>
                 </button>
               ))}
             </div>
           ) : (
             <div className="divide-y divide-border/10">
               {notifications.map(n => (
                 <button key={n.id} onClick={() => { setSelectedNotif(n); if(!n.is_read) handleMarkAsRead(n.id); }} className={`w-full p-4 md:p-6 flex gap-4 hover:bg-muted/50 transition-all text-left ${selectedNotif?.id === n.id ? "bg-primary/5 border-l-4 border-primary" : ""} ${n.is_read ? "opacity-60" : ""}`}>
                   <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${getNotifColor(n.type || "info")}`}>{getNotifIcon(n.type || "info")}</div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-[11px] md:text-sm truncate uppercase tracking-tight">{n.data?.title || n.title || "Note"}</p>
                     {isAdmin && (n as any).user && (
                        <p className="text-[9px] md:text-[10px] font-black text-primary/60 mt-0.5 uppercase tracking-widest">
                            {t("admin.recipient") || "Người nhận"}: {(n as any).user.name}
                        </p>
                     )}
                     <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 md:line-clamp-2 mt-1">{n.data?.message || n.message}</p>
                   </div>
                   {!n.is_read && !isAdmin && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                 </button>
               ))}
             </div>
           )}
        </div>

         {/* List content ends here */}
        </div>

      {/* 3. Detail Pane */}
      <div className={`flex-1 bg-muted/10 relative flex flex-col min-w-0 ${ (activeConv || selectedNotif) ? "flex" : "hidden md:flex"}`}>
        <AnimatePresence mode="wait">
          {activeConv ? (
             <motion.div key="chat" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full bg-background fixed md:absolute inset-0 md:relative z-[310] md:z-20">
                <div className="p-4 md:p-5 border-b border-border/50 bg-card flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setActiveConv(null)} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">{activeConv.other_user?.name?.charAt(0)}</div>
                      <div className="flex flex-col">
                         <h3 className="font-black text-sm md:text-md tracking-tight uppercase leading-none">{activeConv.other_user?.name}</h3>
                         <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("inbox.online") || "Online"}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       {!isDeletingConv ? (
                         <button 
                           onClick={() => setIsDeletingConv(true)}
                           className="p-2 md:p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"
                           title={t("inbox.delete_conversation")}
                         >
                             <Trash2 size={18} />
                         </button>
                       ) : (
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteConversation(activeConv.id)}
                              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-black text-[10px] md:text-xs uppercase transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                            >
                                <CheckCheck size={14} /> {t("inbox.confirm") || "Xóa"}
                            </button>
                            <button 
                              onClick={() => setIsDeletingConv(false)}
                              className="px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all"
                            >
                                {t("inbox.cancel_short") || "Hủy"}
                            </button>
                         </div>
                       )}
                   </div>
                </div>
           
           <AnimatePresence>
             {viewingImage && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setViewingImage(null)}>
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-5xl w-full">
                    <img src={viewingImage} alt="Fullscreen" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button onClick={() => window.open(viewingImage, '_blank')} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"><LinkIcon size={20} /></button>
                       <button onClick={() => setViewingImage(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all"><X size={20} /></button>
                    </div>
                  </motion.div>
               </motion.div>
             )}
           </AnimatePresence>
                <div 
                   ref={scrollContainerRef}
                   className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex flex-col"
                 >
                   {pagination.has_more && (
                      <button 
                        onClick={() => fetchMessages(activeConv.id, pagination.current_page + 1)}
                        disabled={loadingMore}
                        className="self-center text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-all py-4 hover:scale-110 active:scale-95"
                      >
                        {loadingMore ? t("inbox.loading") : t("inbox.load_older")}
                      </button>
                   )}
                   
                   {messages.map((msg, i) => {
                     const isMe = msg.sender_id === user?.id;
                     return (
                       <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border/50 rounded-tl-none"}`}>
                             {msg.media_url && (
                               <div className="mb-2 rounded-lg overflow-hidden border border-white/10 shadow-inner group relative">
                                 <img 
                                   src={msg.media_url} 
                                   alt="media" 
                                   className="max-w-full h-auto object-cover hover:scale-105 transition-all duration-500 cursor-pointer" 
                                   onClick={() => setViewingImage(msg.media_url)} 
                                 />
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Search className="text-white" size={24} />
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
                                 className={`mb-2 p-2 rounded-xl border flex gap-3 cursor-pointer hover:shadow-lg transition-all ${isMe ? "bg-white/10 border-white/20" : "bg-muted/50 border-border"}`}
                               >
                                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0">
                                   <img src={msg.product.media?.[0]?.url || 'https://via.placeholder.com/64'} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[10px] md:text-xs font-bold truncate line-clamp-1">{msg.product.title}</p>
                                   <p className="text-[9px] md:text-[10px] font-black text-primary mt-1">{msg.product.price?.toLocaleString()} đ</p>
                                 </div>
                               </div>
                             )}
                             {msg.message_text && <p className="text-[13px] md:text-sm leading-relaxed">{msg.message_text}</p>}
                             <div className={`text-[9px] mt-1.5 opacity-50 flex items-center gap-2 ${isMe ? "justify-end" : ""}`}>
                               {isMe && (
                                 <CheckCheck size={10} />
                               )}
                             </div>
                          </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-card border-t border-border/50 flex flex-col gap-3">
                    {selectedProductId && (
                      <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-xl relative border border-primary/20">
                         <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0"><Package size={16} className="m-2" /></div>
                         <p className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">{t("inbox.product_attached")}</p>
                         <button onClick={() => setSelectedProductId(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X size={12} /></button>
                      </div>
                    )}
                    
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <label className={`p-2 rounded-xl hover:bg-muted cursor-pointer transition-colors ${uploading ? "animate-pulse opacity-50" : ""}`}>
                          <ImageIcon size={20} />
                          <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} disabled={uploading} />
                        </label>
                        <button type="button" onClick={fetchShopProducts} className="p-2 rounded-xl hover:bg-muted transition-colors">
                          <Package size={20} />
                        </button>
                      </div>
                      
                      <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder={uploading ? t("inbox.loading") : t("inbox.say_something")}
                        disabled={uploading}
                        className="flex-1 bg-muted/50 rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 outline-none text-sm"
                      />
                      <button type="submit" disabled={(!newMessage.trim() && !uploading && !selectedProductId) || uploading} className="bg-primary text-primary-foreground p-3 rounded-xl md:rounded-2xl shadow-lg disabled:opacity-20 transition-all shrink-0">
                        <Send size={18} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isAttachingProduct && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl">
                          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-card w-full max-w-2xl border border-border shadow-2xl rounded-[32px] md:rounded-[48px] overflow-hidden flex flex-col max-h-[85vh]">
                             <div className="p-6 md:p-8 border-b border-border bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between">
                                <div>
                                   <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase px-2">{t("inbox.attach_product") || "CHỌN SẢN PHẨM"}</h2>
                                   <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 ml-2 mt-1">{t("inbox.select_desc") || "Tìm kiếm và đính kèm vào tin nhắn"}</p>
                                </div>
                                <button onClick={() => setIsAttachingProduct(false)} className="p-3 md:p-4 bg-muted hover:bg-muted/80 rounded-full transition-all group active:scale-95"><X size={20} className="group-hover:rotate-90 transition-transform duration-300" /></button>
                             </div>
                             
                             <div className="p-4 md:p-6 bg-muted/20 border-b border-border">
                                <div className="relative">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                                   <input 
                                     autoFocus
                                     type="text" 
                                     value={productSearch} 
                                     onChange={(e) => setProductSearch(e.target.value)}
                                     placeholder={t("inbox.search_product_placeholder") || "Tìm kiếm sản phẩm theo tên..."}
                                     className="w-full pl-12 pr-6 py-4 bg-muted/50 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                                   />
                                </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                                  {shopProducts.filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                    <button key={p.id} type="button" onClick={() => { setSelectedProductId(p.id); setIsAttachingProduct(false); setProductSearch(""); }} className="group p-2 flex flex-col gap-2 hover:bg-primary/5 rounded-2xl transition-all text-left border border-transparent hover:border-primary/20">
                                      <div className="aspect-square w-full rounded-xl bg-card overflow-hidden shrink-0 border border-border group-hover:shadow-lg transition-all">
                                          <img src={p.media?.[0]?.url || 'https://via.placeholder.com/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      </div>
                                      <div className="px-1">
                                          <p className="text-[10px] font-bold truncate uppercase">{p.title}</p>
                                          <p className="text-[11px] font-black text-primary mt-0.5">{p.price?.toLocaleString()} đ</p>
                                      </div>
                                    </button>
                                  ))}
                                  {shopProducts.filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                    <p className="col-span-full text-center py-10 text-[10px] font-black uppercase opacity-20 tracking-widest">{t("inbox.no_products")}</p>
                                  )}
                                </div>
                             </div>
                             
                             <div className="p-4 md:p-6 bg-muted/20 border-t border-border flex justify-end">
                                <button onClick={() => setIsAttachingProduct(false)} className="px-8 py-3 bg-muted hover:bg-muted/80 rounded-xl md:rounded-2xl font-black text-xs uppercase transition-all">{t("inbox.close") || "Đóng"}</button>
                             </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                 </form>
             </motion.div>
          ) : selectedNotif ? (
             <motion.div key="notif" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full bg-card overflow-y-auto fixed md:absolute inset-0 md:relative z-[310] md:z-20 p-6 md:p-20">
                <button onClick={() => setSelectedNotif(null)} className="absolute top-4 md:top-8 left-4 md:left-8 p-2 md:p-3 hover:bg-muted rounded-full transition-all"><ChevronLeft size={24} /></button>
                
                <div className="max-w-2xl mx-auto w-full pt-10 md:pt-0">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-10 shadow-lg ${getNotifColor(selectedNotif.type || "system")}`}>{getNotifIcon(selectedNotif.type || "system")}</div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-4 md:mb-6">{selectedNotif.data?.title || selectedNotif.title}</h1>
                  <p className="text-muted-foreground text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 md:mb-10 pb-4 md:pb-6 border-b">{t("inbox.sent_on")} {new Date(selectedNotif.created_at).toLocaleString()}</p>
                  
                  <div className="text-sm md:text-lg leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap mb-10">
                    {selectedNotif.data?.message || selectedNotif.message}
                  </div>



                  {(selectedNotif.data?.link || selectedNotif.link) && (
                    <a href={selectedNotif.data?.link || selectedNotif.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-foreground text-background rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:scale-[1.02] transition-all shadow-xl">
                      {t("inbox.take_action")} <LinkIcon size={16} />
                    </a>
                  )}

                  {isAdmin && (
                    <div className="mt-10 md:mt-20 pt-6 md:pt-10 border-t border-border/50 flex justify-center gap-3">
                       {!isConfirmingDelete ? (
                         <button onClick={() => setIsConfirmingDelete(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all">
                           <Trash2 size={14} /> {t("inbox.delete")}
                         </button>
                       ) : (
                         <>
                           <button onClick={() => handleDeleteNotification(selectedNotif.id)} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-black text-[10px] md:text-xs uppercase transition-all shadow-lg hover:scale-105 active:scale-95">
                             <CheckCheck size={14} /> {t("inbox.confirm")}
                           </button>
                           <button onClick={() => setIsConfirmingDelete(false)} className="px-6 py-2.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all">
                             {t("inbox.cancel_short")}
                           </button>
                         </>
                       )}
                    </div>
                  )}
                </div>
             </motion.div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/20 p-10 select-none">
                <Store size={100} className="md:w-[150px] md:h-[150px]" />
                <h2 className="text-xl md:text-3xl font-black mt-4 uppercase tracking-tighter">{t("inbox.unified_title")}</h2>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-2">{t("inbox.selection_required")}</p>
             </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Bottom Tab Control (Mobile Only) - Moved here to stay permanent at bottom */}
      <div className="md:hidden flex border-t border-border/50 bg-card p-2 gap-2 shrink-0 z-50">
         <button onClick={() => { setActiveTab("chat"); setSelectedNotif(null); setActiveConv(null); }} className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
           <div className="relative">
              <MessageCircle size={20} />
              {hasUnreadMessages && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
           </div>
           <span className="text-[10px] font-bold uppercase">{t("inbox.messages")}</span>
         </button>
         <button onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }} className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === "notifications" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
           <div className="relative">
              <Bell size={20} />
              {hasUnreadNotifications && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
           </div>
           <span className="text-[10px] font-bold uppercase">{t("inbox.notifications")}</span>
         </button>
      </div>

      <AnimatePresence>
        {isAdmin && showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-md">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card w-full max-w-xl border border-border shadow-2xl rounded-3xl md:rounded-[40px] overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-6 md:p-8 border-b border-border bg-primary/5 flex items-center justify-between">
                   <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase px-4">{t("inbox.new_broadcast")}</h2>
                   <button onClick={() => setShowCreateModal(false)} className="p-2 md:p-3 bg-muted rounded-full"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateNotification} className="p-6 md:p-8 space-y-4 md:space-y-6">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.headline")}</label>
                     <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="..." className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                   </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.target_role") || "ĐỐI TƯỢNG NHẬN"}</label>
                      <select 
                        value={form.role} 
                        onChange={e => setForm({...form, role: e.target.value})}
                        className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer font-bold"
                      >
                         <option value="all">{t("inbox.role_all") || "Tất cả mọi người"}</option>
                         <option value="customer">{t("inbox.role_customer") || "Khách hàng"}</option>
                         <option value="seller">{t("inbox.role_seller") || "Người bán / Shop"}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.action_link")}</label>
                      <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://..." className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none text-sm" />
                    </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.message_body")}</label>
                     <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="..." className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none resize-none text-sm" />
                   </div>

                   <div className="pt-4 flex gap-3 md:gap-4">
                      <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 md:py-4 font-bold border rounded-xl md:rounded-2xl hover:bg-muted text-xs uppercase transition-all">{t("inbox.cancel")}</button>
                       <button disabled={loading || !form.title || !form.message} className="flex-[2] bg-primary text-primary-foreground py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold shadow-lg text-xs uppercase tracking-widest transition-all">
                        {loading ? t("inbox.sending") : t("inbox.broadcast")}
                       </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        body.hide-mobile-menu #mobile-hamburger { display: none !important; }
      `}</style>
    </div>
  );
}



