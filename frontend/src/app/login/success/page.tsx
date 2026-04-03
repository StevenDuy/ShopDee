"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function LoginSuccess() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Fetch user info with the token
      axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const user = res.data;
        setAuth(user, token);
        
        if (user.role_id === 1) {
          router.push("/admin");
        } else if (user.role_id === 2) {
          router.push("/seller");
        } else {
          router.push("/");
        }
      }).catch(() => {
        router.push("/login?error=auth_failed");
      });
    } else {
      router.push("/login");
    }
  }, [searchParams, router, setAuth, API_URL]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-black uppercase tracking-widest">{t("common.authenticating")}</h2>
      </div>
    </div>
  );
}
