"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Search, Send, Image as ImageIcon, CheckCheck, MapPin, Store } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
// In real use, import echo here and listen to private-chat.${conversation.id}

const API = "http://localhost:8000/api";

export default function ChatPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
         .then(r => setConversations(r.data))
         .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (activeConv) {
      axios.get(`${API}/chat/${activeConv.id}`, { headers: { Authorization: `Bearer ${token}` } })
           .then(r => {
             setMessages(r.data.messages);
             setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
           });
    }
  }, [activeConv, token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    try {
      const res = await axios.post(`${API}/chat/${activeConv.id}`, { message_text: newMessage }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error("Failed to send", e); }
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex text-foreground bg-background">
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-80 border-r border-border shrink-0 flex flex-col ${activeConv ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
             <div className="p-6 text-center text-muted-foreground text-sm">
               No conversations yet. Support and seller chats will appear here.
             </div>
          ) : (
            conversations.map(conv => (
              <button 
                key={conv.id} 
                onClick={() => setActiveConv(conv)}
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
                    {conv.last_message?.message_text || "Sent an attachment"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex col flex-col bg-card ${!activeConv ? "hidden md:flex" : "flex"}`}>
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
            <Store size={64} className="opacity-20 mb-4" />
            <h2 className="text-2xl font-bold text-foreground">ShopDee Chat</h2>
            <p className="text-center mt-2 max-w-sm">Select a conversation from the sidebar to start messaging sellers or support.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 sticky top-0 bg-card z-10 shrink-0">
              <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg">
                 &larr;
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {activeConv.other_user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-semibold">{activeConv.other_user?.name || "Seller"}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              <div className="text-center text-xs text-muted-foreground my-4">
                Conversation started on {new Date(activeConv.created_at).toLocaleDateString()}
              </div>
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    key={msg.id || i} 
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-accent text-foreground border border-border rounded-tl-sm"}`}>
                      {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}
                      {msg.media_url && <img src={msg.media_url} alt="attachment" className="mt-2 rounded-xl max-w-full" />}
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

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0">
              <div className="flex items-center gap-2 bg-input border border-border rounded-full pr-2 pl-4 py-1">
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-2">
                  <ImageIcon size={20} />
                </button>
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent py-2 outline-none text-sm min-w-0"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
