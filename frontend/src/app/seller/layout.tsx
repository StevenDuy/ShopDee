"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SellerSidebar } from "@/components/seller/Sidebar";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, token, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated) {
      if (!token || !user) {
        router.replace("/login");
      } else if (user.role_id !== 2 && user.role_id !== 1) {
        // 2 = Seller, 1 = Admin. Customers (3) should not access seller dashboard.
        router.replace("/");
      }
    }
  }, [hasHydrated, token, user, router]);

  if (!hasHydrated || !token || !user || (user.role_id !== 2 && user.role_id !== 1)) {
    return null; // Silent load during redirect
  }

  return (
    <div className="flex bg-white dark:bg-slate-900 h-screen overflow-hidden">
      <SellerSidebar />
      <main className="flex-1 overflow-y-auto w-full relative bg-background/50 dark:bg-slate-950/50">
        <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
