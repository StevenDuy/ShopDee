"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Bell, Package, CheckCircle, Info, Star } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API = "http://localhost:8000/api";

const getIcon = (type: string) => {
  if (type.includes("order")) return <Package size={18} />;
  if (type.includes("success")) return <CheckCircle size={18} />;
  if (type.includes("review")) return <Star size={18} />;
  return <Info size={18} />;
};

const getColor = (type: string) => {
  if (type.includes("order")) return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  if (type.includes("success")) return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  if (type.includes("review")) return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-muted text-muted-foreground";
};

export default function NotificationsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data.data || []);
    } catch {}
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
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell size={24} /> Alerts
        </h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline font-medium">
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-2xl">
            <Bell size={48} className="mx-auto mb-3 opacity-30" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={notif.id}
              onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${notif.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getColor(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium ${!notif.is_read ? "text-foreground" : "text-foreground/80"}`}>{notif.title}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm ${!notif.is_read ? "text-foreground/90 font-medium" : "text-muted-foreground"} leading-relaxed`}>
                  {notif.message}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-3" />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
