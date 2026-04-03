"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, ShoppingBag, Chrome } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const registered = searchParams.get("registered") === "true";
  const resetSuccess = searchParams.get("reset") === "true";

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
      setError(e.response?.data?.message || t("auth.login_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20">
              <ShoppingBag size={32} className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">ShopDee</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">{t("auth.system_subtitle")}</p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.email")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shopdee.com"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.password")}</label>
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
              <div className="flex justify-end pr-1">
                <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  {t("auth.forgot_password")}
                </Link>
              </div>
            </div>

            {resetSuccess && (
              <div className="text-xs font-black uppercase tracking-widest text-white bg-green-600 px-4 py-3 border-2 border-black">
                {t("auth.reset_success_msg")}
              </div>
            )}

            {error && (
              <div className="text-xs font-black uppercase tracking-widest text-white bg-destructive px-4 py-3 border-2 border-black">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full h-14 text-xs tracking-widest">
              <LogIn size={18} className="mr-2" /> {t("auth.login_btn")}
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px bg-border flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap opacity-50">{t("auth.or_divider")}</span>
              <div className="h-px bg-border flex-1"></div>
            </div>

            <Button type="button" onClick={handleGoogleLogin} variant="outline" size="lg" className="w-full h-14 text-xs tracking-widest border-border/50">
              <Chrome size={18} className="mr-2" /> {t("auth.continue_with_google")}
            </Button>

            <div className="text-center mt-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                 {t("auth.no_account")} <Link href="/register" className="text-primary hover:underline underline-offset-4">{t("auth.register_now")}</Link>
               </p>
            </div>
          </form>

          {/* Quick Login */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center mb-4 opacity-70">{t("auth.demo_accounts")}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("roles.customer"), email: "customer@shopdee.com" },
                { label: t("roles.seller"),   email: "seller@shopdee.com" },
                { label: t("roles.admin"),    email: "admin@shopdee.com" },
              ].map((acc) => (
                <Button key={acc.email} variant="secondary" size="xs" onClick={() => { setEmail(acc.email); setPassword("password"); }}
                  className="font-black text-[9px] hover:bg-primary hover:text-white transition-all">
                  {acc.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
          Powered by Antigravity Flat-Engine
        </p>
      </div>
    </div>
  );
}



