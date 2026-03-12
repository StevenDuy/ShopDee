"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, ShoppingBag } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

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
      const res = await axios.post("http://localhost:8000/api/login", { email, password });
      const user = res.data.user;
      setAuth(user, res.data.token);
      
      if (user.role_id === 2) {
        router.push("/seller");
      } else if (user.role_id === 3) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground">ShopDee</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@shopdee.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo accounts (password: password)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Customer", email: "customer@shopdee.com" },
                { label: "Seller",   email: "seller@shopdee.com" },
                { label: "Admin",    email: "admin@shopdee.com" },
              ].map((acc) => (
                <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword("password"); }}
                  className="py-2 text-xs bg-muted rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
