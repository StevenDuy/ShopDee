"use client";

import { useState, useEffect } from "react";
import { X, Send, Mail, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
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
      setError("Mã xác thực không đúng.");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <Card className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-border/50 shadow-2xl p-8 hover:scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 hover:rotate-90 transition-transform">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Mail className="text-primary" /> Thay đổi Email
        </h2>

        {/* Steps header */}
        <div className="flex gap-2 mb-8 items-center">
          <div className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <ArrowRight size={14} className="text-muted-foreground opacity-50" />
          <div className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bước 1: Xác thực email hiện tại ({currentEmail})
              </p>
              
              <Button 
                onClick={() => handleSendOtp(currentEmail)}
                disabled={loading || countdown > 0}
                variant="outline"
                className="w-full h-12 text-[10px] tracking-widest font-black uppercase border-border/50"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : <><Send size={16} className="mr-2" /> Gửi mã đến email cũ</>}
              </Button>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nhập mã xác thực</label>
                <Input
                  type="text"
                  value={oldOtp}
                  onChange={(e) => setOldOtp(e.target.value)}
                  className="h-14 font-black text-center text-xl tracking-[10px] focus:ring-primary/20 bg-primary/5 border-primary/30"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleVerifyOld}
                disabled={loading || oldOtp.length < 6}
                size="lg"
                className="w-full h-14 text-xs tracking-widest"
              >
                Tiếp tục
              </Button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-4">
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bước 2: Xác thực email mới
              </p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email mới</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 h-12"
                    placeholder="new-email@example.com"
                  />
                  <Button 
                    onClick={() => handleSendOtp(newEmail)}
                    disabled={loading || countdown > 0 || !newEmail}
                    variant="outline"
                    className="px-4 h-12 text-[10px] font-black uppercase border-border/50"
                  >
                    {countdown > 0 ? `${countdown}s` : "Gửi mã"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mã xác thực email mới</label>
                <Input
                  type="text"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value)}
                  className="h-14 font-black text-center text-xl tracking-[10px] focus:ring-primary/20 bg-primary/5 border-primary/30"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleFinalUpdate}
                disabled={loading || newOtp.length < 6 || !newEmail}
                size="lg"
                className="w-full h-14 text-xs tracking-widest"
              >
                <CheckCircle size={18} className="mr-2" /> CẬP NHẬT NGAY
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 text-[10px] font-black uppercase text-destructive bg-destructive/10 p-3 border border-destructive/20 rounded-lg text-center tracking-widest">{error}</p>}
        {success && <p className="mt-4 text-[10px] font-black uppercase text-green-600 bg-green-500/10 p-3 border border-green-500/20 rounded-lg text-center tracking-widest">{success}</p>}
        </Card>
      </motion.div>
    </div>
  );
}



