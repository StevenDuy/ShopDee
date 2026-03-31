"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Store, MapPin, Phone, User, Save, Plus, Edit2, 
  Trash2, ShieldCheck, Settings, Package, Layout,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import AddressModal from "@/components/profile/AddressModal";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function SellerSettingsPage() {
  const { t } = useTranslation();
  const { token, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setFormData({
        name: data.name || "",
        phone: data.profile?.phone || "",
      });
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      await axios.put(`${API_URL}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: "success", text: t("seller.settings.update_success") });
      fetchUser(); // refresh user store
    } catch (err: any) {
      setMessage({ type: "error", text: t("seller.settings.update_error") });
    } finally {
      setSaving(false);
    }
  };

  const openAddressModal = (addr: any = null) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    try {
      console.log(`[FINANCE TERMINAL] Attempting administrative removal of address ID: ${id}`);
      await axios.delete(`${API_URL}/profile/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingId(null);
      fetchData();
    } catch (err) {
      console.error("[FINANCE TERMINAL] Failed to delete address", err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Settings size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    SHOP // CONFIGURATION
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                {t("seller.settings.title")}
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                {t("seller.settings.desc")}
              </p>
           </div>
        </div>

        {/* 2. MAIN GRID (2 Columns: Profile & Address) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Store Profile Section */}
           <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-4 ml-4">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store size={16} className="text-primary" />
                 </div>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("seller.settings.store_details")}</h2>
              </div>

              <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm p-10 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-8 translate-x-8 rotate-12 scale-150">
                    <Layout size={200} strokeWidth={1} />
                 </div>

                 {message.text && (
                    <motion.div 
                       initial={{ opacity: 0, y: -10 }} 
                       animate={{ opacity: 1, y: 0 }}
                       className={cn(
                          "mb-8 p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border",
                          message.type === 'success' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-destructive/5 text-destructive border-destructive/20'
                       )}
                    >
                       {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                       {message.text}
                    </motion.div>
                 )}

                 <form onSubmit={handleProfileSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
                          {t("seller.settings.store_name")} <span className="text-destructive">*</span>
                       </label>
                       <div className="relative group">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                          <Input
                             type="text"
                             value={formData.name}
                             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                             className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm tracking-tight focus-visible:ring-primary/10 transition-all"
                             placeholder="SHOP NAME"
                             required
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
                          {t("seller.settings.service_phone")}
                       </label>
                       <div className="relative group">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                          <Input
                             type="text"
                             value={formData.phone}
                             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                             className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm tracking-tight focus-visible:ring-primary/10 transition-all"
                             placeholder="PHONE NUMBER"
                          />
                       </div>
                    </div>

                    <div className="pt-6">
                       <Button
                          type="submit"
                          disabled={saving}
                          className="h-16 px-12 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95"
                       >
                          {saving ? t("seller.settings.saving") : t("seller.settings.save_changes")}
                          <Save size={18} className="ml-3" />
                       </Button>
                    </div>
                 </form>
              </Card>
           </div>

           {/* Addresses Section */}
           <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center justify-between ml-4">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                       <MapPin size={16} className="text-primary" />
                    </div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("seller.settings.addresses")}</h2>
                 </div>
                 <button 
                    onClick={() => openAddressModal()}
                    className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                 >
                    <Plus size={20} strokeWidth={3} />
                 </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                 <AnimatePresence mode="popLayout">
                    {addresses.length === 0 ? (
                       <Card className="rounded-[2.5rem] border-dashed border-2 border-border/30 bg-muted/5 p-12 text-center grayscale opacity-40">
                          <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                             {t("seller.settings.no_addresses")}
                          </p>
                       </Card>
                    ) : (
                       addresses.map((addr, idx) => (
                          <motion.div
                             key={addr.id}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.05 }}
                          >
                             <Card className="rounded-[2rem] border-border/30 bg-card/40 backdrop-blur-sm p-6 group transition-all hover:bg-muted/30 relative">
                                <div className="flex items-start justify-between mb-4">
                                   <div className="flex gap-2">
                                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/50 px-2">
                                         {addr.type}
                                      </Badge>
                                      {addr.is_default && (
                                         <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-2">
                                            {t("profile_page.default")}
                                         </Badge>
                                      )}
                                   </div>
                                   <div className="flex gap-1 relative z-20">
                                      <AnimatePresence mode="wait">
                                         {deletingId === addr.id ? (
                                            <motion.div 
                                               key="confirm"
                                               initial={{ opacity: 0, scale: 0.9 }} 
                                               animate={{ opacity: 1, scale: 1 }} 
                                               exit={{ opacity: 0, scale: 0.9 }}
                                               className="flex items-center gap-1 bg-destructive/10 p-1 rounded-xl border border-destructive/20"
                                            >
                                               <button 
                                                  type="button" 
                                                  onClick={() => handleDeleteAddress(addr.id)}
                                                  className="px-3 py-1.5 bg-destructive text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-destructive/90 transition-all shadow-sm"
                                               >
                                                  CONFIRM
                                               </button>
                                               <button 
                                                  type="button" 
                                                  onClick={() => setDeletingId(null)}
                                                  className="px-3 py-1.5 bg-background text-muted-foreground text-[9px] font-black uppercase tracking-widest rounded-lg border border-border/50 hover:bg-muted transition-all"
                                               >
                                                  CANCEL
                                               </button>
                                            </motion.div>
                                         ) : (
                                            <motion.div 
                                               key="actions"
                                               initial={{ opacity: 0, scale: 0.9 }} 
                                               animate={{ opacity: 1, scale: 1 }} 
                                               exit={{ opacity: 0, scale: 0.9 }}
                                               className="flex gap-1"
                                            >
                                               <button 
                                                  type="button"
                                                  onClick={() => openAddressModal(addr)} 
                                                  className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                               >
                                                  <Edit2 size={14} />
                                               </button>
                                               <button 
                                                  type="button"
                                                  onClick={() => setDeletingId(addr.id)} 
                                                  className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                               >
                                                  <Trash2 size={14} />
                                               </button>
                                            </motion.div>
                                         )}
                                      </AnimatePresence>
                                   </div>
                                </div>
                                
                                <div className="space-y-1">
                                   <p className="font-black text-[14px] uppercase tracking-tight text-foreground leading-none">
                                      {addr.address_line_1}
                                   </p>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                      {addr.city}, {addr.country}
                                   </p>
                                </div>
                             </Card>
                          </motion.div>
                       ))
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        {/* 3. MODAL SYSTEM */}
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSuccess={() => fetchData()}
          token={token}
          address={editingAddress}
        />
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
