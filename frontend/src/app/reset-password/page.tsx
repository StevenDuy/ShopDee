"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Key, CheckCircle, ShieldCheck } from "lucide-react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${API_URL}/auth/password/reset`, {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation
      });
      setSuccess("Mật khẩu của bạn đã được cập nhật!");
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link href="/forgot-password" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Quay lại
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Đặt lại mật khẩu</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">Nhập mã xác thực và mật khẩu mới của bạn</p>
      </div>

      <div className="bg-card border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-muted/50 border-2 border-dashed border-black font-bold text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Mã xác thực (6 số)</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-primary/5 border-2 border-black font-black text-center text-xl tracking-[10px] focus:outline-none"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Mật khẩu mới</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted border-2 border-black font-bold text-sm focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {(error || success) && (
            <div className={`text-[10px] font-black uppercase p-3 border-2 border-black ${
              success ? "bg-green-500 text-white" : "bg-destructive text-white"
            }`}>
              {error || success}
            </div>
          )}

          <button type="submit" disabled={loading || !!success}
            className="w-full py-4 bg-primary text-primary-foreground border-4 border-black font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            {loading ? "ĐANG THỰC HIỆN..." : <><CheckCircle size={20} /> CẬP NHẬT MẬT KHẨU</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background border-[10px] border-primary flex items-center justify-center p-6">
      <Suspense fallback={<div>Đang tải...</div>}>
         <ResetPasswordForm />
      </Suspense>
    </div>
  );
}



