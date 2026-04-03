"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Key, CheckCircle, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ResetPasswordForm() {
  const { t } = useTranslation();
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
      setError(t("auth.passwords_not_match"));
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
      setSuccess(t("auth.password_updated_success"));
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.reset_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <Link href="/forgot-password" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t("auth.back")}
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">{t("auth.reset_password_title")}</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">{t("auth.reset_password_subtitle")}</p>
      </div>

      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.email")}</label>
            <Input
              type="email"
              value={email}
              readOnly
              className="h-12 bg-muted/30 border-dashed opacity-70"
            />
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-primary ml-1">{t("auth.otp_verification_label")}</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-14 font-black text-center text-xl tracking-[10px] focus:ring-primary/20 bg-primary/5 border-primary/30"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.new_password")}</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.confirm_password")}</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="pl-10 h-12"
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

          <Button type="submit" disabled={loading || !!success} size="lg" className="w-full h-14 text-xs tracking-widest">
            {loading ? t("auth.processing") : <><CheckCircle size={18} className="mr-2" /> {t("auth.update_password_btn")}</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

      <Suspense fallback={<div>{t("loading")}</div>}>
         <ResetPasswordForm />
      </Suspense>
    </div>
  );
}



