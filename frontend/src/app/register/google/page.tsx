"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, User, Store, ArrowRight } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RegisterGoogle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [roleId, setRoleId] = useState<number>(3); // Mặc định là Customer
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email");
  const name = searchParams.get("name");
  const googleId = searchParams.get("google_id");
  const googleToken = searchParams.get("google_token");

  useEffect(() => {
    if (!googleId || !email) {
      router.push("/login");
    }
  }, [googleId, email, router]);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/google/register`, {
        email,
        name,
        google_id: googleId,
        google_token: googleToken,
        role_id: roleId,
      });

      setAuth(res.data.user, res.data.token);
      
      if (roleId === 2) {
        router.push("/seller");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Hoàn tất đăng ký thất bại.");
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight">Chào mừng {name}!</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">Bước cuối cùng: Chọn vai trò của bạn</p>
        </div>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-border/50 shadow-2xl p-8 hover:scale-100">
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setRoleId(3)}
              className={`w-full flex items-center gap-4 p-4 border transition-all rounded-xl ${
                roleId === 3 ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-background/50 hover:bg-muted/50"
              }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${roleId === 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <User size={24} />
              </div>
              <div className="text-left">
                <p className={`font-bold uppercase text-sm ${roleId === 3 ? "text-primary" : "text-foreground"}`}>Tôi là Người mua</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Mua hàng và đánh giá sản phẩm</p>
              </div>
            </button>

            <button
              onClick={() => setRoleId(2)}
              className={`w-full flex items-center gap-4 p-4 border transition-all rounded-xl ${
                roleId === 2 ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-background/50 hover:bg-muted/50"
              }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${roleId === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Store size={24} />
              </div>
              <div className="text-left">
                <p className={`font-bold uppercase text-sm ${roleId === 2 ? "text-primary" : "text-foreground"}`}>Tôi là Người bán</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Bán sản phẩm và quản lý cửa hàng</p>
              </div>
            </button>
          </div>

          {error && (
            <div className="text-[10px] font-black uppercase bg-destructive text-white p-4 border-border/50 mb-4 rounded-xl">
              {error}
            </div>
          )}

          <Button
            onClick={handleComplete}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-xs tracking-widest"
          >
            {loading ? "ĐANG XỬ LÝ..." : (
              <>HOÀN TẤT <ArrowRight size={18} className="ml-2" /></>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}



