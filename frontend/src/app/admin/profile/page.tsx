"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Shield, Lock, Save, 
  CheckCircle2, AlertCircle, Camera 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminProfilePage() {
  const { t } = useTranslation();
  const { user, token, fetchUser } = useAuthStore();
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      setSuccess(null);
      
      const res = await axios.put(`${API}/user/profile-information`, {
        name,
        email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 200) {
        setSuccess(t("admin.profile.update_success"));
        if (user) {
            fetchUser();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("profile_page.update_failed"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      setError(t("admin.profile.password_match_error"));
      return;
    }

    try {
      setIsChangingPass(true);
      setError(null);
      setSuccess(null);
      
      await axios.put(`${API}/user/password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(t("admin.profile.password_success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || t("admin.profile.password_error"));
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6 md:p-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-8 border-primary pb-8 gap-6 text-wrap">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">{t("admin.profile.title")}</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase opacity-60 tracking-widest">{t("admin.profile.desc")}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-primary/5 border-2 border-primary/20 p-4 shrink-0">
            <div className="w-16 h-16 bg-primary flex items-center justify-center text-white font-black text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t("admin.profile.role")}</p>
                <p className="text-xl font-black uppercase text-primary">{t("roles.admin")}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Forms */}
        <div className="lg:col-span-8 space-y-10">
            
            {/* Status Messages */}
            {(success || error) && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 border-4 flex items-center gap-4 ${success ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-red-500/10 border-red-500 text-red-600'}`}>
                    {success ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                    <p className="font-black uppercase tracking-tight">{success || error}</p>
                </motion.div>
            )}

            {/* Profile Info Form */}
            <form onSubmit={handleUpdateProfile} className="bg-card border-2 border-border p-8 md:p-10 space-y-8 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-2">
                    <User className="text-primary" size={24} />
                    <h2 className="text-2xl font-black uppercase tracking-tight">{t("admin.profile.personal_info")}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-wrap">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin.profile.name")}</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-muted/30 border-2 border-transparent focus:border-primary p-4 outline-none font-bold text-sm transition-all shadow-sm"
                            placeholder={t("admin.profile.name_placeholder") || "Tên đầy đủ"}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin.profile.email")}</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-muted/30 border-2 border-transparent focus:border-primary p-4 outline-none font-bold text-sm transition-all shadow-sm"
                            placeholder={t("admin.profile.email_placeholder") || "email@example.com"}
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isUpdating}
                    className="bg-primary text-white px-10 py-5 font-black uppercase text-xs tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                >
                    {isUpdating ? t("loading") : t("admin.profile.save")}
                </button>
            </form>

            {/* Password Change Form */}
            <form onSubmit={handleChangePassword} className="bg-card border-2 border-border p-8 md:p-10 space-y-8 relative group">
                <div className="flex items-center gap-4 mb-2">
                    <Lock className="text-primary" size={24} />
                    <h2 className="text-2xl font-black uppercase tracking-tight">{t("admin.profile.security")}</h2>
                </div>

                <div className="space-y-6 max-w-md text-wrap">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin.profile.current_password")}</label>
                        <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-muted/30 border-2 border-transparent focus:border-primary p-4 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin.profile.new_password")}</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-muted/30 border-2 border-transparent focus:border-primary p-4 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin.profile.confirm_new_password")}</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-muted/30 border-2 border-transparent focus:border-primary p-4 outline-none font-bold text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isChangingPass}
                    className="bg-zinc-900 text-white px-10 py-5 font-black uppercase text-xs tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                >
                    {isChangingPass ? t("loading") : t("profile_page.change_password")}
                </button>
            </form>
        </div>

        {/* Right Side: Quick Stats/Info */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-primary/5 border-2 border-primary/20 p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40">{t("admin.profile.system_access") || "Truy Cập Hệ Thống"}</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                            <Shield size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase opacity-40">{t("admin.profile.auth_level") || "Auth Level"}</p>
                            <p className="text-xs font-black uppercase truncate">{t("admin.profile.master_admin") || "Cấp 10 (Master Admin)"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-wrap overflow-hidden">
                        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
                            <Mail size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase opacity-40">{t("admin.profile.verified_email") || "Verified Email"}</p>
                            <p className="text-xs font-black truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4 mt-6 border-t border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                        &quot;{t("admin.profile.profile_notice_desc")}&quot;
                    </p>
                </div>
            </div>

            <div className="bg-muted p-8 space-y-4 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t("admin.profile.session_info") || "Session Information"}</p>
                <div className="flex flex-col gap-1 overflow-hidden">
                    <p className="text-[10px] font-bold truncate">IP: 192.168.1.1</p>
                    <p className="text-[10px] font-bold truncate">{t("admin.profile.last_login")}: 12 OCT 2023</p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
