"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Shield, Lock, Save, 
  CheckCircle2, AlertCircle, Camera,
  ShieldCheck, History, Activity, 
  Key, LogOut, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminProfilePage() {
  const { t } = useTranslation();
  const { user, token, fetchUser, logout } = useAuthStore();
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      setIsUpdating(true);
      const res = await axios.put(`${API}/user/profile-information`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 200) {
        toast.success(t("admin.profile.update_success"));
        fetchUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("profile_page.update_failed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      toast.error(t("admin.profile.password_match_error"));
      return;
    }

    try {
      setIsChangingPass(true);
      await axios.put(`${API}/user/password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(t("admin.profile.password_success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("admin.profile.password_error"));
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-6xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <User size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    SECURED AREA // IDENTITY
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                Admin Profile
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                MANAGEMENT // ACCESS CONTROL V4.2
              </p>
           </div>
           
           <div className="flex flex-col items-center md:items-end gap-3 group">
              <div className="relative">
                 <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-4xl font-black shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    {user?.name?.charAt(0).toUpperCase()}
                 </div>
                 <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-background border border-border shadow-xl rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95">
                    <Camera size={18} />
                 </button>
              </div>
              <div className="text-center md:text-right">
                 <p className="text-xl font-black uppercase tracking-tight leading-none text-foreground">{user?.name}</p>
                 <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-3 h-5">
                    MASTER ADMIN
                 </Badge>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Configuration Forms */}
          <div className="lg:col-span-8 space-y-10">
              
              {/* Profile Information */}
              <Card className="rounded-[3rem] border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden p-8 md:p-12 relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="flex items-center gap-4 mb-10 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <Mail size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black uppercase tracking-tight">{t("admin.profile.personal_info")}</h2>
                         <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Update your core identity data</p>
                      </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2.5">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t("admin.profile.name")}</label>
                              <Input 
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="h-14 bg-muted/20 border-transparent rounded-2xl font-bold text-sm shadow-none focus-visible:bg-background focus-visible:ring-primary/20 transition-all placeholder:opacity-30"
                                  placeholder="Full Name"
                              />
                          </div>
                          <div className="space-y-2.5">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t("admin.profile.email")}</label>
                              <Input 
                                  type="email" 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="h-14 bg-muted/20 border-transparent rounded-2xl font-bold text-sm shadow-none focus-visible:bg-background focus-visible:ring-primary/20 transition-all placeholder:opacity-30"
                                  placeholder="email@example.com"
                              />
                          </div>
                      </div>

                      <Button 
                          type="submit"
                          disabled={isUpdating}
                          className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-primary/10 active:scale-95 transition-all"
                      >
                          <Save className="mr-3" size={18} strokeWidth={3} />
                          {isUpdating ? t("loading") : t("admin.profile.save").toUpperCase()}
                      </Button>
                  </form>
              </Card>

              {/* Security & Password */}
              <Card className="rounded-[3rem] border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden p-8 md:p-12 relative group">
                  <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                         <Lock size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black uppercase tracking-tight">{t("admin.profile.security")}</h2>
                         <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Manage your authentication credentials</p>
                      </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-8">
                      <div className="space-y-6 max-w-md">
                          <div className="space-y-2.5">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t("admin.profile.current_password")}</label>
                              <Input 
                                  type="password" 
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  className="h-14 bg-muted/20 border-transparent rounded-2xl font-bold text-sm shadow-none focus-visible:bg-background transition-all"
                              />
                          </div>
                          <div className="space-y-2.5">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t("admin.profile.new_password")}</label>
                              <Input 
                                  type="password" 
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-14 bg-muted/20 border-transparent rounded-2xl font-bold text-sm shadow-none focus-visible:bg-background transition-all"
                              />
                          </div>
                          <div className="space-y-2.5">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t("admin.profile.confirm_new_password")}</label>
                              <Input 
                                  type="password" 
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="h-14 bg-muted/20 border-transparent rounded-2xl font-bold text-sm shadow-none focus-visible:bg-background transition-all"
                              />
                          </div>
                      </div>

                      <Button 
                          type="submit"
                          disabled={isChangingPass}
                          className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-zinc-900 hover:bg-black text-white shadow-lg active:scale-95 transition-all"
                      >
                          <Key className="mr-3" size={18} strokeWidth={3} />
                          {isChangingPass ? t("loading") : t("profile_page.change_password").toUpperCase()}
                      </Button>
                  </form>
              </Card>
          </div>

          {/* Right Sidebar: Telemetry & Access */}
          <div className="lg:col-span-4 space-y-8">
              <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 space-y-10 relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-primary">
                     <Shield size={200} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-8">System Telemetry</h3>
                    
                    <div className="space-y-8">
                        <div className="flex items-center gap-5 group">
                            <div className="w-12 h-12 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-0.5">Authorization Tier</p>
                                <p className="text-[13px] font-black uppercase tracking-tight text-foreground truncate">Level 10 Master Admin</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 group">
                            <div className="w-12 h-12 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                <History size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-0.5">Session Integrity</p>
                                <p className="text-[13px] font-black uppercase tracking-tight text-foreground truncate">Verified IP // Active</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 group">
                            <div className="w-12 h-12 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                <Activity size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-0.5">Audit Logging</p>
                                <p className="text-[13px] font-black uppercase tracking-tight text-foreground truncate">Full Trace Enabled</p>
                            </div>
                        </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-primary/10">
                      <p className="text-[11px] font-bold text-muted-foreground italic leading-relaxed opacity-60">
                         &quot;Security is not a product, but a process.&quot;
                      </p>
                  </div>
              </div>

              <Card className="rounded-[3rem] border-border/50 bg-muted/30 p-8 space-y-6 group cursor-default">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Quick Actions</p>
                     <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="space-y-3">
                     <Button variant="ghost" className="w-full justify-between h-12 px-5 rounded-2xl hover:bg-background hover:shadow-sm group/btn">
                        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover/btn:text-foreground">Activity Log</span>
                        <ChevronRight size={16} className="text-muted-foreground opacity-40 group-hover/btn:opacity-100" />
                     </Button>
                     <Button variant="ghost" className="w-full justify-between h-12 px-5 rounded-2xl hover:bg-background hover:shadow-sm group/btn">
                        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover/btn:text-foreground">Connected Devices</span>
                        <ChevronRight size={16} className="text-muted-foreground opacity-40 group-hover/btn:opacity-100" />
                     </Button>
                     <Button 
                       onClick={() => logout()}
                       variant="ghost" 
                       className="w-full justify-between h-12 px-5 rounded-2xl hover:bg-red-500/5 group/btn border border-transparent hover:border-red-500/10"
                     >
                        <span className="text-[11px] font-black uppercase tracking-wider text-destructive">Terminate Session</span>
                        <LogOut size={16} className="text-destructive opacity-40 group-hover/btn:opacity-100" />
                     </Button>
                  </div>
              </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
