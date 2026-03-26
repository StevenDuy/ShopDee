"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, User, Store, ArrowRight } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

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
    <div className="min-h-screen bg-background border-[10px] border-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Chào mừng {name}!</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">Bước cuối cùng: Chọn vai trò của bạn</p>
        </div>

        <div className="bg-card border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setRoleId(3)}
              className={`w-full flex items-center gap-4 p-4 border-4 transition-all ${
                roleId === 3 ? "border-primary bg-primary/10" : "border-black bg-muted hover:bg-muted/80"
              }`}
            >
              <div className={`p-3 border-2 border-black ${roleId === 3 ? "bg-primary text-white" : "bg-white text-black"}`}>
                <User size={24} />
              </div>
              <div className="text-left">
                <p className="font-black uppercase text-sm">Tôi là Người mua</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Mua hàng và đánh giá sản phẩm</p>
              </div>
            </button>

            <button
              onClick={() => setRoleId(2)}
              className={`w-full flex items-center gap-4 p-4 border-4 transition-all ${
                roleId === 2 ? "border-primary bg-primary/10" : "border-black bg-muted hover:bg-muted/80"
              }`}
            >
              <div className={`p-3 border-2 border-black ${roleId === 2 ? "bg-primary text-white" : "bg-white text-black"}`}>
                <Store size={24} />
              </div>
              <div className="text-left">
                <p className="font-black uppercase text-sm">Tôi là Người bán</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Bán sản phẩm và quản lý cửa hàng</p>
              </div>
            </button>
          </div>

          {error && (
            <div className="text-xs font-black uppercase bg-destructive text-white p-3 border-2 border-black mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground border-4 border-black font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {loading ? "ĐANG XỬ LÝ..." : (
              <>HOÀN TẤT <ArrowRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



