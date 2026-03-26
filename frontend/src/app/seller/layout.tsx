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
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <SellerSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

