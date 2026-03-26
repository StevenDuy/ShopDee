"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Settings, Save, Percent, Truck, Power } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [settings, setSettings] = useState({
    platform_fee: "5",
    shipping_base_rate: "10.00",
    tax_rate: "8.5",
    maintenance_mode: "0", // Stored as string '0' or '1'
  });

  const fetchSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      // Pre-fill state with fetched keys if they exist
      setSettings(prev => ({
        platform_fee: data['platform_fee']?.value ?? prev.platform_fee,
        shipping_base_rate: data['shipping_base_rate']?.value ?? prev.shipping_base_rate,
        tax_rate: data['tax_rate']?.value ?? prev.tax_rate,
        maintenance_mode: data['maintenance_mode']?.value ?? prev.maintenance_mode,
      }));
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Transform state object into array format requested by backend
      const payload = Object.entries(settings).map(([key, value]) => ({
         key,
         value: value.toString(),
         type: key === 'maintenance_mode' ? 'boolean' : 'numeric',
         group: key === 'platform_fee' ? 'finance' : 'platform'
      }));

      await axios.put(`${API_URL}/admin/settings`, { settings: payload }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: "success", text: t("admin.system_config.update_success") });
    } catch (err) {
      setMessage({ type: "error", text: t("admin.system_config.update_error") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.system_config.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.system_config.desc")}</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-32 px-10 bg-card border-4 border-dashed border-border rounded-[48px] text-center shadow-inner mt-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }} 
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-10 border-2 border-primary/20 relative z-10"
        >
          <Settings size={44} className="text-primary stroke-[2.5px]" />
        </motion.div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-foreground/90">
            {i18n.language === "vi" ? "Sớm ra mắt" : "Coming Soon"}
          </h2>
          <div className="h-1.5 w-24 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-muted-foreground text-sm max-w-sm font-bold uppercase tracking-[0.3em] opacity-40 leading-relaxed">
             {i18n.language === "vi" 
              ? "Tính năng cấu hình hệ thống đang được tinh chỉnh và sẽ sẵn sàng cho bạn trong thời gian tới."
              : "System configuration features are being refined and will be available soon."}
          </p>
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.1 }}
           className="absolute -bottom-20 -right-20"
        >
           <Settings size={300} strokeWidth={0.5} />
        </motion.div>
      </div>
      </motion.div>
    </div>
  );
}
