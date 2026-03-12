"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push("/login");
    } else if (user && user.role_id !== 3) {
      router.push("/");
    }
  }, [token, user, router]);

  if (!mounted || !token || !user || user.role_id !== 3) {
    return null; // Return null while checking auth to prevent flash
  }

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 bg-card border border-border rounded-full hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
