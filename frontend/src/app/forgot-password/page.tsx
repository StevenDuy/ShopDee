"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${API_URL}/auth/otp/send`, {
        email,
        purpose: "reset_password"
      });
      setSuccess("Mã xác thực đã được gửi đến email của bạn.");
      // Chuyển sang trang reset password kèm email
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi mã xác thực.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background border-[10px] border-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Quên mật khẩu?</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">Đừng lo, chúng tôi sẽ gửi mã xác thực cho bạn</p>
        </div>

        <div className="bg-card border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Email tài khoản</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-[10px] font-black uppercase bg-destructive text-white p-3 border-2 border-black">
                {error}
              </div>
            )}

            {success && (
              <div className="text-[10px] font-black uppercase bg-green-500 text-white p-3 border-2 border-black">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-black text-white border-4 border-black font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_10px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              {loading ? "ĐANG GỬI..." : <><Send size={20} /> GỬI MÃ XÁC THỰC</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
