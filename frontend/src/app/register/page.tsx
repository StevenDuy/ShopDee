"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, ShoppingBag, User, Store, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [roleId, setRoleId] = useState<number>(3); // 3: Customer, 2: Seller
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSendOtp = async () => {
    if (!email) {
      setError("Vui lòng nhập email trước khi gửi mã.");
      return;
    }
    setOtpLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${API_URL}/auth/otp/send`, {
        email,
        purpose: "registration"
      });
      setIsOtpSent(true);
      setSuccess("Mã xác thực đã được gửi!");
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể gửi mã xác thực.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) {
      setError("Vui lòng xác thực email trước.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        role_id: roleId,
        code,
      });

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background border-[10px] border-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Đăng ký ShopDee</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">Tham gia cộng đồng mua sắm 2D</p>
        </div>

        {/* Card */}
        <div className="bg-card border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  disabled={isOtpSent}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  placeholder="you@shopdee.com"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || countdown > 0}
                  className="px-4 py-3 bg-black text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all border-2 border-black"
                >
                  {otpLoading ? "..." : countdown > 0 ? `${countdown}s` : isOtpSent ? "Gửi lại" : "Gửi mã"}
                </button>
              </div>
            </div>

            {isOtpSent && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Mã xác thực (OTP)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-primary/10 border-2 border-primary font-black text-center text-xl tracking-[10px] focus:outline-none"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-[9px] font-bold text-primary mt-1 uppercase">Kiểm tra email của bạn để lấy mã!</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-foreground pb-1">Bạn muốn gia nhập với tư cách?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleId(3)}
                  className={`py-3 border-2 font-black uppercase text-[10px] tracking-tighter transition-all ${
                    roleId === 3 ? "bg-primary text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted text-muted-foreground border-border hover:border-black"
                  }`}
                >
                  Người mua
                </button>
                <button
                  type="button"
                  onClick={() => setRoleId(2)}
                  className={`py-3 border-2 font-black uppercase text-[10px] tracking-tighter transition-all ${
                    roleId === 2 ? "bg-primary text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted text-muted-foreground border-border hover:border-black"
                  }`}
                >
                  Người bán
                </button>
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
              className="w-full py-4 bg-primary text-primary-foreground border-4 border-black font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <UserPlus size={20} /> ĐĂNG KÝ
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
          Powered by ShopDee 2D Flat-Engine
        </p>
      </div>
    </div>
  );
}




