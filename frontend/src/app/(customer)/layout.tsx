"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, token, hasHydrated, fetchUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only act after Zustand has hydrated from localStorage
    if (!hasHydrated) return;

    if (token && !user) {
      // Token exists in storage but user info not loaded yet — fetch it
      fetchUser();
    } else if (!token) {
      // Definitely not logged in — redirect
      router.replace("/login");
    } else if (user && user.role_id === 2) {
      // Seller trying to access customer view
      router.replace("/seller");
    } else if (user && user.role_id === 3) {
      router.replace("/admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, token, user]);

  // Show a loading spinner until the store has hydrated from localStorage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // After hydration, redirect is handled by useEffect above; show spinner during fetch
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <CustomerHeader />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <CustomerFooter />
      </div>
    </div>
  );
}
