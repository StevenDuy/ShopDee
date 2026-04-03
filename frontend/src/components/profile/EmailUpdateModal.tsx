"use client";

import { useState, useEffect } from "react";
import { X, Send, Mail, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
  currentEmail: string;
  token: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function EmailUpdateModal({ isOpen, onClose, onSuccess, currentEmail, token }: EmailUpdateModalProps) {
  const [step, setStep] = useState(1); // 1: Verify Old, 2: Verify New
  const [oldOtp, setOldOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setOldOtp("");
      setNewEmail("");
      setNewOtp("");
      setError(null);
      setSuccess(null);
      setCountdown(0);
    }
  }, [isOpen]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (targetEmail: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${API_URL}/auth/otp/send`, {
        email: targetEmail,
        purpose: "change_email"
      });
      setSuccess(`Mã xác thực đã gửi đến ${targetEmail}`);
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi gửi mã.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOld = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/auth/otp/verify`, {
        email: currentEmail,
        code: oldOtp,
        purpose: "change_email"
      });
      setStep(2);
      setSuccess("Đã xác thực email cũ. Hãy nhập email mới.");
      setCountdown(0);
    } catch (err: any) {
      setError("Mã xác thực không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/profile/change-email`, {
        old_email_code: oldOtp,
        new_email: newEmail,
        new_email_code: newOtp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess(newEmail);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi cập nhật email.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-[520px] relative"
      >
        <Card className="rounded-[3rem] border-border/30 bg-card/60 backdrop-blur-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-10 md:p-12 overflow-hidden relative">
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none -translate-y-8 translate-x-8 rotate-12 scale-150">
                <Mail size={240} strokeWidth={1} />
            </div>

            <button 
                onClick={onClose} 
                className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground hover:bg-muted transition-all active:scale-90 z-20"
            >
                <X size={20} />
            </button>

            <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Cập nhật Email</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Xác thực 2 lớp bảo mật</p>
                        </div>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 px-1">
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-700", step >= 1 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-muted")} />
                    <ArrowRight size={14} className={cn("transition-opacity", step === 2 ? "opacity-100" : "opacity-20")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-700", step === 2 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-muted")} />
                </div>

                <div className="min-h-[280px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div 
                                key="step1"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">
                                        Bước 1: Xác thực email cũ <br/>
                                        <span className="text-foreground/60 break-all">({currentEmail})</span>
                                    </p>
                                    
                                    <Button 
                                        onClick={() => handleSendOtp(currentEmail)}
                                        disabled={loading || countdown > 0}
                                        variant="outline"
                                        className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 active:scale-95 transition-all"
                                    >
                                        {countdown > 0 ? `Gửi lại sau ${countdown}s` : <><Send size={16} className="mr-2" /> Gửi mã đến email cũ</>}
                                    </Button>

                                    <div className="space-y-4 pt-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Mã xác thực</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                            <Input
                                                type="text"
                                                value={oldOtp}
                                                onChange={(e) => setOldOtp(e.target.value)}
                                                className="h-20 pl-16 text-center text-3xl font-black tracking-[0.5em] bg-primary/5 border-primary/20 rounded-2xl focus-visible:ring-primary/20 transition-all font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleVerifyOld}
                                    disabled={loading || oldOtp.length < 6}
                                    className="w-full h-18 py-8 rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    TIẾP TỤC <ArrowRight size={18} className="ml-2" />
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="step2"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">
                                        Bước 2: Xác thực email mới
                                    </p>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Email mới</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1 group">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                                <Input
                                                    type="email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    className="h-16 pl-16 bg-muted/10 border-border/50 rounded-2xl font-black text-sm tracking-tight focus-visible:ring-primary/10 transition-all"
                                                    placeholder="new@example.com"
                                                />
                                            </div>
                                            <Button 
                                                onClick={() => handleSendOtp(newEmail)}
                                                disabled={loading || countdown > 0 || !newEmail}
                                                variant="outline"
                                                className="h-16 px-6 font-black text-[10px] uppercase tracking-widest border-border/50 rounded-2xl active:scale-95 transition-all shadow-sm shrink-0"
                                            >
                                                {countdown > 0 ? `${countdown}s` : <Send size={16} />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Mã xác thực email mới</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                                            <Input
                                                type="text"
                                                value={newOtp}
                                                onChange={(e) => setNewOtp(e.target.value)}
                                                className="h-20 pl-16 text-center text-3xl font-black tracking-[0.5em] bg-primary/5 border-primary/20 rounded-2xl focus-visible:ring-primary/20 transition-all font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleFinalUpdate}
                                    disabled={loading || newOtp.length < 6 || !newEmail}
                                    className="w-full h-18 py-8 rounded-[1.5rem] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 border-emerald-400/20"
                                >
                                    <CheckCircle size={20} className="mr-3" /> HOÀN TẤT CẬP NHẬT
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px] font-black uppercase tracking-widest text-center shadow-inner">
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-[11px] font-black uppercase tracking-widest text-center shadow-inner">
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper function
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
