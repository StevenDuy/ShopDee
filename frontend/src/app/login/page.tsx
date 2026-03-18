"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, ShoppingBag } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("customer@shopdee.com");
  const [password, setPassword] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const user = res.data.user;
      setAuth(user, res.data.token);
      
      if (user.role_id === 1) {
        router.push("/admin");
      } else if (user.role_id === 2) {
        router.push("/seller");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background border-[10px] border-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-primary flex items-center justify-center border-4 border-black">
              <ShoppingBag size={32} className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">ShopDee 2D</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">Hệ thống Thương mại điện tử</p>
        </div>

        {/* Card */}
        <div className="bg-card border-4 border-black p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted border-2 border-border font-bold text-sm focus:outline-none focus:border-primary"
                placeholder="you@shopdee.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-foreground mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-muted border-2 border-border font-bold text-sm focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-black uppercase tracking-widest text-white bg-destructive px-4 py-3 border-2 border-black">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground border-4 border-black font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <><LogIn size={20} /> ĐĂNG NHẬP</>
              )}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-8 pt-8 border-t-2 border-black">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center mb-4">Tài khoản mẫu</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Guest", email: "customer@shopdee.com" },
                { label: "Seller",   email: "seller@shopdee.com" },
                { label: "Admin",    email: "admin@shopdee.com" },
              ].map((acc) => (
                <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword("password"); }}
                  className="py-2 text-[10px] font-black uppercase bg-muted border border-border hover:bg-primary hover:text-white hover:border-black">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
          Powered by Antigravity Flat-Engine
        </p>
      </div>
    </div>
  );
}
