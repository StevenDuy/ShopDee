"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/admin/Sidebar";

import FullPageLoader from "@/components/FullPageLoader";

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
    return <FullPageLoader />;
  }

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
