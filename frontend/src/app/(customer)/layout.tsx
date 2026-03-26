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
    } else if (user && user.role_id === 1) {
      // Admin trying to access customer view
      router.replace("/admin");
    } else if (user && user.role_id === 2) {
      // Seller trying to access customer view
      router.replace("/seller");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, token, user]);

  // Show a loading spinner until the store has hydrated from localStorage
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
      </div>
    );
  }

  // After hydration, redirect is handled by useEffect above; show spinner during fetch
  // Removed: if (!token) return null; // Allow guest access

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

