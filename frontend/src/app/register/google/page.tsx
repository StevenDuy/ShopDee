"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, User, Store, ArrowRight, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function GoogleRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [roleId, setRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setName(searchParams.get("name") || "User");
  }, [searchParams]);

  const handleCompleteSetup = async () => {
    if (!roleId) return;
    setLoading(true);
    setError("");

    try {
      const token = searchParams.get("token");
      const res = await axios.post(`${API}/auth/google/complete`, {
        role_id: roleId,
        token: token
      });

      if (res.data.status === "success") {
        setAuth(res.data.user, res.data.access_token);
        // Redirect based on role
        if (roleId === 2) router.push("/seller/dashboard");
        else router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("common.error_occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Background Aesthetics */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 border border-primary/20">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter">
            {t("auth.google_setup.welcome", { name: name })}
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-4 opacity-70">
            {t("auth.google_setup.final_step")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Customer Role */}
          <button 
            onClick={() => setRoleId(3)}
            className={`p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group ${
              roleId === 3 
                ? "border-primary bg-primary/[0.03] shadow-2xl shadow-primary/10 scale-[1.02]" 
                : "border-border/50 bg-card/50 hover:border-primary/30"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
              roleId === 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              <User size={28} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
                <p className={`font-black uppercase text-sm tracking-tight ${roleId === 3 ? "text-primary" : "text-foreground"}`}>
                  {t("auth.google_setup.i_am_customer")}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-1 leading-relaxed">
                  {t("auth.google_setup.customer_desc")}
                </p>
            </div>
            {roleId === 3 && (
              <motion.div layoutId="role-indicator" className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,61,0,0.5)]" />
            )}
          </button>

          {/* Seller Role */}
          <button 
            onClick={() => setRoleId(2)}
            className={`p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group ${
              roleId === 2 
                ? "border-primary bg-primary/[0.03] shadow-2xl shadow-primary/10 scale-[1.02]" 
                : "border-border/50 bg-card/50 hover:border-primary/30"
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
              roleId === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              <Store size={28} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
                <p className={`font-black uppercase text-sm tracking-tight ${roleId === 2 ? "text-primary" : "text-foreground"}`}>
                  {t("auth.google_setup.i_am_seller")}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-1 leading-relaxed">
                  {t("auth.google_setup.seller_desc")}
                </p>
            </div>
            {roleId === 2 && (
              <motion.div layoutId="role-indicator" className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,61,0,0.5)]" />
            )}
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase bg-red-500/10 text-red-500 p-5 border border-red-500/20 mb-8 rounded-[1.5rem] text-center tracking-widest"
          >
            {error}
          </motion.div>
        )}

        <Button 
          disabled={!roleId || loading} 
          onClick={handleCompleteSetup}
          className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {t("auth.google_setup.complete_btn")} 
              <ArrowRight size={20} strokeWidth={3} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
