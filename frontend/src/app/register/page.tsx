"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, ShoppingBag, User, Store, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại đăng nhập
        </Link>

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">Đăng ký</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">Tham gia hệ thống Thương mại điện tử 2.0</p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Họ và tên</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  disabled={isOtpSent}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1"
                  placeholder="you@shopdee.com"
                  required
                />
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || countdown > 0}
                  variant="outline"
                  className="h-12 px-4 text-[10px] font-black uppercase tracking-widest border-border/50"
                >
                  {otpLoading ? "..." : countdown > 0 ? `${countdown}s` : isOtpSent ? "Gửi lại" : "Gửi mã"}
                </Button>
              </div>
            </div>

            {isOtpSent && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary ml-1">Mã xác thực (OTP)</label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-14 font-black text-center text-xl tracking-[10px] focus:ring-primary/20 bg-primary/5 border-primary/30"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-[9px] font-bold text-primary/70 mt-1 uppercase text-center">Kiểm tra email của bạn để lấy mã!</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mật khẩu</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bạn muốn gia nhập với tư cách?</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={roleId === 3 ? "default" : "secondary"}
                  onClick={() => setRoleId(3)}
                  className="h-12 text-[10px] tracking-widest font-black uppercase transition-all"
                >
                  <User size={16} className="mr-2" /> Người mua
                </Button>
                <Button
                  type="button"
                  variant={roleId === 2 ? "default" : "secondary"}
                  onClick={() => setRoleId(2)}
                  className="h-12 text-[10px] tracking-widest font-black uppercase transition-all"
                >
                  <Store size={16} className="mr-2" /> Người bán
                </Button>
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

            <Button type="submit" disabled={loading} size="lg" className="w-full h-14 text-xs tracking-widest">
              <UserPlus size={18} className="mr-2" /> ĐĂNG KÝ
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
          Powered by ShopDee 2D Flat-Engine
        </p>
      </div>
    </div>
  );
}




