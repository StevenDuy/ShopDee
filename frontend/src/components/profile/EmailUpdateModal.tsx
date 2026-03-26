"use client";

import { useState, useEffect } from "react";
import { X, Send, Mail, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card w-full max-w-md border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 hover:rotate-90 transition-transform">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Mail className="text-primary" /> Thay đổi Email
        </h2>

        {/* Steps header */}
        <div className="flex gap-2 mb-8 items-center">
          <div className={`h-2 rounded-full flex-1 ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <ArrowRight size={14} className="text-muted-foreground" />
          <div className={`h-2 rounded-full flex-1 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bước 1: Xác thực email hiện tại ({currentEmail})
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSendOtp(currentEmail)}
                  disabled={loading || countdown > 0}
                  className="w-full py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all border-2 border-black flex items-center justify-center gap-2"
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : <><Send size={18} /> Gửi mã đến email cũ</>}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Nhập mã xác thực</label>
                <input
                  type="text"
                  value={oldOtp}
                  onChange={(e) => setOldOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border-2 border-black font-black text-center text-xl tracking-[8px] focus:outline-none focus:border-primary"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button 
                onClick={handleVerifyOld}
                disabled={loading || oldOtp.length < 6}
                className="w-full py-4 bg-primary text-white border-2 border-black font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Tiếp tục
              </button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-4">
               <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Bước 2: Xác thực email mới
              </p>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Email mới</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 px-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none"
                    placeholder="new-email@example.com"
                  />
                  <button 
                    onClick={() => handleSendOtp(newEmail)}
                    disabled={loading || countdown > 0 || !newEmail}
                    className="px-4 bg-black text-white font-black text-[10px] uppercase border-2 border-black disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : "Gửi mã"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-foreground mb-2">Nhập mã xác thực email mới</label>
                <input
                  type="text"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-primary/10 border-2 border-primary font-black text-center text-xl tracking-[8px] focus:outline-none"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button 
                onClick={handleFinalUpdate}
                disabled={loading || newOtp.length < 6 || !newEmail}
                className="w-full py-4 bg-green-500 text-black border-2 border-black font-black uppercase tracking-widest hover:bg-green-400 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} /> Cập nhật ngay
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 text-[10px] font-black uppercase text-red-600 bg-red-100 p-2 border-2 border-red-600">{error}</p>}
        {success && <p className="mt-4 text-[10px] font-black uppercase text-green-600 bg-green-100 p-2 border-2 border-green-600">{success}</p>}
      </motion.div>
    </div>
  );
}



