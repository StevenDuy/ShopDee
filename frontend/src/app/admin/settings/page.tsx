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
  const { t } = useTranslation();
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.system_config.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.system_config.desc")}</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Settings */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            <h2 className="text-lg font-bold">{t("admin.system_config.platform_params")}</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Percent size={16} /> {t("admin.system_config.platform_fee")}
              </label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={settings.platform_fee}
                onChange={(e) => setSettings({...settings, platform_fee: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">{t("admin.system_config.platform_fee_desc")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Truck size={16} /> {t("admin.system_config.shipping_rate")}
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={settings.shipping_base_rate}
                onChange={(e) => setSettings({...settings, shipping_base_rate: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">{t("admin.system_config.shipping_rate_desc")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Percent size={16} /> {t("admin.system_config.tax_rate")}
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={settings.tax_rate}
                onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">{t("admin.system_config.tax_rate_desc")}</p>
            </div>
          </div>
        </div>

        {/* Operational Guard */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 flex items-center justify-between">
              <div>
                 <h2 className="text-lg font-bold flex items-center gap-2">
                    <Power size={20} className={settings.maintenance_mode === "1" ? "text-amber-500" : "text-green-500"} />
                    {t("admin.system_config.maintenance_mode")}
                 </h2>
                 <p className="text-sm text-muted-foreground mt-1">{t("admin.system_config.maintenance_desc")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrinks-0">
                 <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenance_mode === "1"}
                    onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked ? "1" : "0"})}
                 />
                 <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
           </div>
        </div>

        <div className="flex justify-end pt-4">
           <button 
             type="submit" 
             disabled={saving}
             className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
           >
              <Save size={18} />
              {saving ? t("admin.system_config.saving") : t("admin.system_config.save_all")}
           </button>
        </div>

      </form>
      </motion.div>
    </div>
  );
}
