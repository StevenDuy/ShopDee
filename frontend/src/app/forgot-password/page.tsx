"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
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
      setSuccess(t("auth.otp_sent_to_email"));
      // Chuyển sang trang reset password kèm email
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.otp_error"));
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
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t("auth.back_to_login")}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">{t("auth.forgot_password_title")}</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">{t("auth.forgot_password_subtitle")}</p>
        </div>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("auth.email_label")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
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

            <Button type="submit" disabled={loading} size="lg" className="w-full h-14 text-xs tracking-widest">
              {loading ? t("auth.sending") : <><Send size={18} className="mr-2" /> {t("auth.send_otp_btn")}</>}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}



