"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Search, Send, Image as ImageIcon, CheckCheck, 
  Bell, MessageCircle, Package, CheckCircle, Info, Star, Store,
  ChevronLeft, Plus, X, Trash2, Paperclip, FileText, Link as LinkIcon,
  MoreVertical, User, ShieldAlert
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import echo from "@/lib/echo";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
  
  const searchParams = useSearchParams();
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
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({ title: "", message: "", link: "", files: [] as File[] });

  useEffect(() => {
    if (!token) return;
    refreshData().then(() => {
      if (targetUserId && activeTab === "chat") {
        handleStartChat(parseInt(targetUserId));
      }
    });
  }, [token, activeTab, targetUserId]);

  useEffect(() => {
    if (activeConv && token) fetchMessages(activeConv.id, 1);
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
    setLoading(true);
    try {
      if (activeTab === "chat") {
        const res = await axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
        setConversations(res.data || []);
      } else {
        const res = await axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(res.data.data || res.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  const handleCompressAndUpload = async (file: File) => {
    try {
      setUploading(true);
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `chat_media/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        });
      });
    } catch (err) {
      console.error("Upload error", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent, mediaUrl?: string) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !mediaUrl || !activeConv || !token) return;
    
    const msgData = { 
      message_text: newMessage,
      media_url: mediaUrl 
    };
    setNewMessage(""); 
    try {
      const res = await axios.post(`${API}/chat/${activeConv.id}`, msgData, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      console.error("Chat Error:", err.response?.data || err.message);
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleCompressAndUpload(file);
    if (url) await handleSendMessage(null as any, url);
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("message", form.message);
      if (form.link) formData.append("link", form.link);
      form.files.forEach(f => formData.append("attachments[]", f));
      await axios.post(`${API}/notifications`, formData, { 
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } 
      });
      setForm({ title: "", message: "", link: "", files: [] });
      setShowCreateModal(false);
      refreshData();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!isAdmin || !confirm(t("inbox.delete_confirm"))) return;
    try {
      await axios.delete(`${API}/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedNotif?.id === id) setSelectedNotif(null);
    } catch (e) { console.error(e); }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
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
          <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase">{t("inbox.messages")}</div>
        </button>
        <button 
          onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }}
          className={`p-4 rounded-[22px] transition-all duration-300 relative group ${activeTab === "notifications" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Bell size={24} />
          {notifications.some(n => !n.is_read) && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
          <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 uppercase">{t("inbox.notifications")}</div>
        </button>
      </div>

      {/* 2. List Pane */}
      <div className={`w-full md:w-[380px] border-r border-border/50 flex flex-col bg-card shrink-0 transition-all ${ (activeConv || selectedNotif) ? "hidden md:flex" : "flex"}`}>
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
             <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
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
                     <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 md:line-clamp-2 mt-1">{n.data?.message || n.message}</p>
                   </div>
                   {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                 </button>
               ))}
             </div>
           )}
        </div>

        {/* 2.1 Bottom Tab Control (Mobile Only) */}
        <div className="md:hidden flex border-t border-border/50 bg-card p-2 gap-2">
           <button onClick={() => { setActiveTab("chat"); setSelectedNotif(null); setActiveConv(null); }} className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
             <MessageCircle size={20} />
             <span className="text-[10px] font-bold uppercase">{t("inbox.messages")}</span>
           </button>
           <button onClick={() => { setActiveTab("notifications"); setActiveConv(null); setSelectedNotif(null); }} className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === "notifications" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
             <div className="relative">
                <Bell size={20} />
                {notifications.some(n => !n.is_read) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
             </div>
             <span className="text-[10px] font-bold uppercase">{t("inbox.notifications")}</span>
           </button>
        </div>
      </div>

      {/* 3. Detail Pane */}
      <div className={`flex-1 bg-muted/10 relative flex flex-col min-w-0 ${ (activeConv || selectedNotif) ? "flex" : "hidden md:flex"}`}>
        <AnimatePresence mode="wait">
          {activeConv ? (
             <motion.div key="chat" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full bg-background absolute inset-0 md:relative z-20">
                <div className="p-4 md:p-5 border-b border-border/50 bg-card flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setActiveConv(null)} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">{activeConv.other_user?.name?.charAt(0)}</div>
                      <h3 className="font-black text-sm md:text-lg truncate max-w-[150px] md:max-w-none">{activeConv.other_user?.name || "Chat"}</h3>
                   </div>
                </div>
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
                               <div className="mb-2 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                                 <img src={msg.media_url} alt="media" className="max-w-full h-auto object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(msg.media_url, '_blank')} />
                               </div>
                             )}
                             {msg.message_text && <p className="text-[13px] md:text-sm leading-relaxed">{msg.message_text}</p>}
                             <div className={`text-[9px] mt-1.5 opacity-50 flex items-center gap-1 ${isMe ? "justify-end" : ""}`}>
                               {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               {isMe && <CheckCheck size={10} />}
                             </div>
                          </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-card border-t border-border/50 flex gap-3 items-center">
                    <label className={`p-2 rounded-xl hover:bg-muted cursor-pointer transition-colors ${uploading ? "animate-pulse opacity-50" : ""}`}>
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} disabled={uploading} />
                    </label>
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder={uploading ? t("inbox.loading") : t("inbox.say_something")}
                      disabled={uploading}
                      className="flex-1 bg-muted/50 rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 outline-none text-sm"
                    />
                    <button type="submit" disabled={(!newMessage.trim() && !uploading) || uploading} className="bg-primary text-primary-foreground p-3 rounded-xl md:rounded-2xl shadow-lg disabled:opacity-20 transition-all shrink-0">
                      <Send size={18} />
                    </button>
                 </form>
             </motion.div>
          ) : selectedNotif ? (
             <motion.div key="notif" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full bg-card overflow-y-auto absolute inset-0 md:relative z-20 p-6 md:p-20">
                <button onClick={() => setSelectedNotif(null)} className="absolute top-4 md:top-8 left-4 md:left-8 p-2 md:p-3 hover:bg-muted rounded-full transition-all"><ChevronLeft size={24} /></button>
                
                <div className="max-w-2xl mx-auto w-full pt-10 md:pt-0">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-10 shadow-lg ${getNotifColor(selectedNotif.type || "system")}`}>{getNotifIcon(selectedNotif.type || "system")}</div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-4 md:mb-6">{selectedNotif.data?.title || selectedNotif.title}</h1>
                  <p className="text-muted-foreground text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 md:mb-10 pb-4 md:pb-6 border-b">{t("inbox.sent_on")} {new Date(selectedNotif.created_at).toLocaleString()}</p>
                  
                  <div className="text-sm md:text-lg leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap mb-10">
                    {selectedNotif.data?.message || selectedNotif.message}
                  </div>

                  {(selectedNotif.data?.attachments || selectedNotif.attachments) && (selectedNotif.data?.attachments || selectedNotif.attachments).length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mb-10">
                      {(selectedNotif.data?.attachments || selectedNotif.attachments).map((f: any, idx: number) => (
                        <a key={idx} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 md:p-4 bg-muted/50 rounded-xl md:rounded-2xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-primary">{f.type?.includes("pdf") ? <FileText size={18} /> : <ImageIcon size={18} />}</div>
                          <div className="min-w-0 flex-1"><p className="text-[11px] md:text-xs font-bold truncate">{f.name || "File"}</p></div>
                        </a>
                      ))}
                    </div>
                  )}

                  {(selectedNotif.data?.link || selectedNotif.link) && (
                    <a href={selectedNotif.data?.link || selectedNotif.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-foreground text-background rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:scale-[1.02] transition-all shadow-xl">
                      {t("inbox.take_action")} <LinkIcon size={16} />
                    </a>
                  )}

                  {isAdmin && (
                    <div className="mt-10 md:mt-20 pt-6 md:pt-10 border-t border-border/50 flex justify-center">
                       <button onClick={() => handleDeleteNotification(selectedNotif.id)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all">
                         <Trash2 size={14} /> {t("inbox.delete")}
                       </button>
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
                     <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.action_link")}</label>
                     <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://..." className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none text-sm" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-2">{t("inbox.message_body")}</label>
                     <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="..." className="w-full px-5 py-2.5 md:py-3 bg-muted/40 rounded-xl outline-none resize-none text-sm" />
                   </div>
                   <div className="space-y-2">
                     <label className="flex items-center gap-3 p-4 border border-dashed border-border rounded-xl hover:bg-primary/5 cursor-pointer">
                        <Paperclip size={18} />
                        <span className="text-[10px] font-bold uppercase">{t("inbox.attach")}</span>
                        <input type="file" multiple className="hidden" onChange={e => e.target.files && setForm({...form, files: [...form.files, ...Array.from(e.target.files!)]})} />
                     </label>
                     <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.files.map((f, i) => (
                           <div key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-2 italic">
                             <span>{f.name}</span>
                             <button type="button" onClick={() => setForm({...form, files: form.files.filter((_, idx) => idx !== i)})}><X size={10} /></button>
                           </div>
                        ))}
                     </div>
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
      `}</style>
    </div>
  );
}
