"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại đăng nhập
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">Quên mật khẩu?</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">Chúng tôi sẽ gửi mã xác thực cho bạn</p>
        </div>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email tài khoản</label>
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
              {loading ? "ĐANG GỬI..." : <><Send size={18} className="mr-2" /> GỬI MÃ XÁC THỰC</>}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}



