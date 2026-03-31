"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/admin/Sidebar";



export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push("/login");
    } else if (user && user.role_id !== 1) {
      router.push("/");
    }
  }, [token, user, router]);

  if (!mounted || !token || !user || user.role_id !== 1) {
    return null; // Silent load during redirect
  }

  return (
    <div className="flex bg-white dark:bg-slate-900 h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto w-full relative bg-background/50 dark:bg-slate-950/50">
        <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

