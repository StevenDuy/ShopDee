"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Settings, Save, Percent, Truck, Power } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminSettingsPage() {
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

      setMessage({ type: "success", text: "System settings saved successfully." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground mt-1">Manage global platform rules, fees, and operational states.</p>
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
            <h2 className="text-lg font-bold">Platform Parameters</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Percent size={16} /> Platform Fee (%)
              </label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={settings.platform_fee}
                onChange={(e) => setSettings({...settings, platform_fee: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">Percentage subtracted from seller payouts.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Truck size={16} /> Shipping Base Rate
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={settings.shipping_base_rate}
                onChange={(e) => setSettings({...settings, shipping_base_rate: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">Default base cost for shipments.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground flex items-center gap-2">
                <Percent size={16} /> Standard Tax Rate (%)
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={settings.tax_rate}
                onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">Global tax rate applied to subtotal.</p>
            </div>
          </div>
        </div>

        {/* Operational Guard */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 flex items-center justify-between">
              <div>
                 <h2 className="text-lg font-bold flex items-center gap-2">
                    <Power size={20} className={settings.maintenance_mode === "1" ? "text-amber-500" : "text-green-500"} />
                    Maintenance Mode
                 </h2>
                 <p className="text-sm text-muted-foreground mt-1">If active, customers and sellers cannot access the platform front-end.</p>
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
              {saving ? "Saving Configurations..." : "Save All Changes"}
           </button>
        </div>

      </form>
    </div>
  );
}
