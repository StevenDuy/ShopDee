"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { User, MapPin, Lock, CheckCircle, Truck, Clock, X, Plus, Trash2, Edit2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";
import AddressModal from "@/components/profile/AddressModal";
import { EmailUpdateModal } from "@/components/profile/EmailUpdateModal";

interface Profile { id: number; name: string; email: string; profile?: { phone?: string } }
interface Address { id: number; type: string; address_line_1: string; city: string; country: string; is_default: boolean }

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, user: authUser, logout } = useAuthStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    axios.get(`${API}/profile`, { headers: authHeaders })
      .then((r) => {
        setProfile(r.data);
        setName(r.data.name);
        setPhone(r.data.profile?.phone ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    const r = await axios.get(`${API}/profile/addresses`, { headers: authHeaders });
    setAddresses(r.data);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, { name, phone }, { headers: authHeaders });
      setSaveMsg(t("profile_page.update_success"));
    } catch { setSaveMsg(t("profile_page.update_failed")); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confPw) { setPwMsg(t("profile_page.passwords_not_match")); return; }
    try {
      await axios.post(`${API}/profile/change-password`, { current_password: curPw, password: newPw, password_confirmation: confPw }, { headers: authHeaders });
      setPwMsg(t("profile_page.password_success")); setTimeout(() => { logout(); router.push("/login"); }, 2000);
    } catch (err: any) {
      setPwMsg(err.response?.data?.message ?? t("profile_page.update_failed"));
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await axios.delete(`${API}/profile/addresses/${id}`, { headers: authHeaders });
    setAddresses(a => a.filter(addr => addr.id !== id));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 animate-in fade-in duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {profile && (
          <>
            {/* 1. SELLER-STYLE HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
               <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                        <User size={22} strokeWidth={2.5} />
                     </div>
                     <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                        {t("profile_page.user_configuration")}
                     </Badge>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                    {t("profile_page.personal_info")}
                  </h1>
                  <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                    {t("profile_page.manage_account_settings")}
                  </p>
               </div>
            </div>

            {/* 2. MAIN GRID (2 Columns: Profile & Address) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* User Profile Section */}
               <div className="lg:col-span-7 space-y-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 ml-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Edit2 size={16} className="text-primary" />
                      </div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("profile_page.personal_info")}</h2>
                    </div>

                    <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm p-10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-8 translate-x-8 rotate-12 scale-150 pointer-events-none">
                          <User size={200} strokeWidth={1} />
                      </div>

                      {saveMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "mb-8 p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border",
                                saveMsg.includes("!") ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-destructive/5 text-destructive border-destructive/20'
                            )}
                          >
                            {saveMsg.includes("!") ? <CheckCircle size={18} /> : <X size={18} />}
                            {saveMsg}
                          </motion.div>
                      )}

                      <div className="space-y-8 relative z-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
                                {t("profile_page.name")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                <Input
                                  value={name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                  className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm tracking-tight focus-visible:ring-primary/10 transition-all"
                                  placeholder={t("profile_page.name_placeholder")}
                                  required
                                />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
                                {t("profile_page.email")}
                            </label>
                            <div className="relative group">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                <Input
                                  value={profile.email}
                                  disabled
                                  className="h-16 pl-16 bg-black/20 border-border/50 rounded-2xl font-black text-sm tracking-tight opacity-60 cursor-not-allowed"
                                />
                                <button 
                                  onClick={() => setIsEmailModalOpen(true)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-xl text-primary transition-all active:scale-95"
                                  title={t("profile_page.change_email")}
                                >
                                  <Edit2 size={18} />
                                </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">
                                {t("profile_page.phone")}
                            </label>
                            <div className="relative group">
                                <Truck className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                <Input
                                  value={phone}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                  className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm tracking-tight focus-visible:ring-primary/10 transition-all"
                                  placeholder={t("profile_page.phone_placeholder")}
                                />
                            </div>
                          </div>

                          <div className="pt-6">
                            <Button 
                                onClick={handleSaveProfile} 
                                disabled={saving}
                                className="h-16 px-12 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                {saving ? t("profile_page.saving") : t("profile_page.save_changes")}
                                <CheckCircle size={18} className="ml-3" />
                            </Button>
                          </div>
                      </div>
                    </Card>
                  </div>

                  {/* Password Section (Seller Style Integrated) */}
                  {!authUser?.google_id && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4 ml-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Lock size={16} className="text-primary" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("profile_page.change_password")}</h2>
                      </div>

                      <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm p-10 shadow-sm relative overflow-hidden">
                        {pwMsg && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                  "mb-8 p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border",
                                  pwMsg.includes("!") ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-destructive/5 text-destructive border-destructive/20'
                              )}
                            >
                              {pwMsg.includes("!") ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                              {pwMsg}
                            </motion.div>
                        )}
                        <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.current_password")}</label>
                              <div className="relative">
                                 <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                 <Input 
                                    type="password" 
                                    value={curPw} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurPw(e.target.value)} 
                                    required
                                    className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm" 
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.new_password")}</label>
                                 <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                    <Input 
                                       type="password" 
                                       value={newPw} 
                                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value)} 
                                       required
                                       className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm" 
                                    />
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.confirm_new_password")}</label>
                                 <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                    <Input 
                                       type="password" 
                                       value={confPw} 
                                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfPw(e.target.value)} 
                                       required
                                       className="h-16 pl-16 bg-muted/20 border-border/50 rounded-2xl font-black text-sm" 
                                    />
                                 </div>
                              </div>
                           </div>
                           <div className="pt-6">
                              <Button type="submit" className="h-16 px-12 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95">
                                 {t("profile_page.update_password")}
                              </Button>
                           </div>
                        </form>
                      </Card>
                    </div>
                  )}
               </div>

               {/* Addresses Section (Seller Style Right Column) */}
               <div className="lg:col-span-5 space-y-8">
                  <div className="flex items-center justify-between ml-4">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin size={16} className="text-primary" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t("profile_page.my_addresses")}</h2>
                    </div>
                    <button 
                        onClick={() => setIsAddrModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[1200px] overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="popLayout">
                        {addresses.length === 0 ? (
                          <Card className="rounded-[2.5rem] border-dashed border-2 border-border/30 bg-muted/5 p-12 text-center grayscale opacity-40">
                              <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                                {t("profile_page.no_addresses")}
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
                                      <div className="flex gap-1">
                                          <button 
                                            onClick={() => handleDeleteAddress(addr.id)} 
                                            className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                          >
                                            <Trash2 size={14} />
                                          </button>
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

            {/* Modals */}
            <AddressModal
              isOpen={isAddrModalOpen}
              onClose={() => setIsAddrModalOpen(false)}
              onSuccess={fetchAddresses}
              token={token}
            />
            
            <EmailUpdateModal
              isOpen={isEmailModalOpen}
              onClose={() => setIsEmailModalOpen(false)}
              currentEmail={profile.email}
              token={token}
              onSuccess={(newEmail: string) => {
                setProfile({ ...profile, email: newEmail });
                setSaveMsg(t("profile_page.email_update_success"));
                setTimeout(() => setSaveMsg(""), 3000);
              }}
            />
          </>
        )}
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
