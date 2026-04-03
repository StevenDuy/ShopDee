"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Send, Mail, X, 
  ArrowRight, ShieldAlert, CheckCircle2, 
  History, Sparkles, Key, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

interface EmailUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newEmail: string) => void;
    currentEmail?: string;
    token?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function EmailUpdateModal({ isOpen, onClose, onSuccess }: EmailUpdateModalProps) {
    const { t } = useTranslation();
    const { user, token, setAuth } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    // Step 1: Verify Old Email
    const [oldOtp, setOldOtp] = useState("");
    
    // Step 2: New Email Setup
    const [newEmail, setNewEmail] = useState("");
    const [newEmailOtp, setNewEmailOtp] = useState("");

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleSendOldOtp = async () => {
        setLoading(true);
        try {
            await axios.post(`${API}/profile/email/send-code-old`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t("auth.check_email_otp"));
            setCountdown(60);
        } catch (err: any) {
            toast.error(err.response?.data?.message || t("common.error_occurred"));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOld = async () => {
        if (!oldOtp) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API}/profile/email/verify-old`, { code: oldOtp }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === "success") {
                setStep(2);
                setCountdown(0);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t("common.error_occurred"));
        } finally {
            setLoading(false);
        }
    };

    const handleSendNewOtp = async () => {
        if (!newEmail) return;
        setLoading(true);
        try {
            await axios.post(`${API}/profile/email/send-code-new`, { email: newEmail }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t("auth.check_email_otp"));
            setCountdown(60);
        } catch (err: any) {
            toast.error(err.response?.data?.message || t("common.error_occurred"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || !newEmailOtp) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API}/profile/email/update`, { 
                email: newEmail,
                code: newEmailOtp 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === "success") {
                setAuth(res.data.user, token ?? "");
                toast.success(t("profile_update.update_success"));
                if (onSuccess) onSuccess(newEmail);
                onClose();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t("common.error_occurred"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/40 backdrop-blur-md" />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-card/60 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden flex"
                >
                    {/* Left Sidebar Info */}
                    <div className="hidden md:flex w-56 bg-primary/10 border-r border-white/10 p-8 flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Mail size={80} /></div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                                <ShieldCheck size={28} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-4">
                                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-primary w-16' : 'bg-primary/20'}`} />
                                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary w-16' : 'bg-primary/20'}`} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Security Note</p>
                            <p className="text-[9px] font-bold leading-relaxed opacity-40 uppercase tracking-tighter italic">
                                Protecting your identity ensures total transaction safety.
                            </p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col">
                        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 z-20">
                            <X size={20} />
                        </button>

                        <div className="flex-1 p-8 md:p-12">
                            <div className="space-y-1 mb-10">
                                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{t("profile_update.email_title")}</h1>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 tracking-widest mt-2">{t("profile_update.two_factor")}</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.form 
                                        key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        onSubmit={(e) => { e.preventDefault(); handleVerifyOld(); }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 group hover:bg-white/10 transition-all">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Old Identity</p>
                                            <p className="font-bold text-base truncate">{user?.email}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Button 
                                                type="button" variant="outline" onClick={handleSendOldOtp} disabled={countdown > 0 || loading}
                                                className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 group"
                                            >
                                                {countdown > 0 ? t("profile_update.resend_in", { seconds: countdown }) : <><Send size={16} className="mr-2 group-hover:translate-x-1 transition-transform" /> {t("profile_update.send_to_old")}</>}
                                            </Button>

                                            <div className="relative group">
                                                <label className="absolute left-6 top-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary transition-all opacity-0 group-focus-within:opacity-100 group-focus-within:top-2">{t("profile_update.auth_code")}</label>
                                                <Input 
                                                    value={oldOtp} onChange={(e) => setOldOtp(e.target.value)} 
                                                    placeholder="OTP CODE" required 
                                                    className="h-16 bg-white/5 border-2 border-transparent rounded-[2rem] text-center text-xl font-black tracking-[0.8em] focus:bg-background focus:border-primary/20 placeholder:tracking-widest placeholder:text-[10px] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <Button disabled={loading || !oldOtp} className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex gap-2">
                                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>{t("common.continue")} <ArrowRight size={18} strokeWidth={3} /></>}
                                        </Button>
                                    </motion.form>
                                ) : (
                                    <motion.form 
                                        key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        onSubmit={(e) => { e.preventDefault(); handleUpdateEmail(); }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <label className="absolute left-6 top-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary transition-all opacity-0 group-focus-within:opacity-100 group-focus-within:top-2">{t("profile_update.new_email")}</label>
                                                <Input 
                                                    type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} 
                                                    placeholder="NEW EMAIL ADDRESS" required
                                                    className="h-16 bg-white/5 border-2 border-transparent rounded-[2rem] px-8 font-bold text-sm focus:bg-background focus:border-primary/20 placeholder:text-[10px] placeholder:tracking-widest transition-all"
                                                />
                                            </div>

                                            <Button 
                                                type="button" variant="outline" onClick={handleSendNewOtp} disabled={countdown > 0 || !newEmail || loading}
                                                className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 group"
                                            >
                                                {countdown > 0 ? t("profile_update.resend_in", { seconds: countdown }) : <><Sparkles size={16} className="mr-2 group-hover:rotate-12 transition-transform" /> {t("profile_update.auth_code")}</>}
                                            </Button>

                                            <div className="relative group">
                                                <label className="absolute left-6 top-1 text-[8px] font-black uppercase tracking-[0.2em] text-primary transition-all opacity-0 group-focus-within:opacity-100 group-focus-within:top-2">{t("profile_update.new_email_code")}</label>
                                                <Input 
                                                    value={newEmailOtp} onChange={(e) => setNewEmailOtp(e.target.value)} 
                                                    placeholder="OTP CODE" required
                                                    className="h-16 bg-white/5 border-2 border-transparent rounded-[2rem] text-center text-xl font-black tracking-[0.8em] focus:bg-background focus:border-primary/20 placeholder:tracking-widest placeholder:text-[10px] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <Button disabled={loading || !newEmailOtp} className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex gap-2">
                                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>{t("common.save")} <Zap size={18} strokeWidth={3} className="fill-white" /></>}
                                        </Button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {/* Decorative Background for Step 2 */}
                        {step === 2 && (
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none -z-10 animate-in fade-in duration-700" />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
