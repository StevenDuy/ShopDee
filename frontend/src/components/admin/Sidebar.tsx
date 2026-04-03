"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Settings, Menu, MessageCircle, Image as ImageIcon, Brain, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { UserDropdown } from "@/components/common/UserDropdown";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuthStore();
  const { unreadCount, fetchUnreadCounts } = useNotificationStore();

  useEffect(() => {
    if (token) {
      fetchUnreadCounts(token);
      const interval = setInterval(() => fetchUnreadCounts(token), 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("admin.dashboard") },
    { href: "/admin/users", icon: Users, label: t("admin.users_nav") },
    { href: "/admin/banners", icon: ImageIcon, label: t("admin.banners_nav") },
    { href: "/admin/products", icon: Package, label: t("admin.products_view") },
    { href: "/admin/inbox", icon: MessageCircle, label: t("admin.inbox_nav"), hasBadge: true },
    { href: "/admin/ai-security", icon: Brain, label: t("admin.ai_security_nav") },
    { href: "/admin/settings", icon: Settings, label: t("admin.settings_nav") },
  ];

  return (
    <>
      {!isOpen && (
        <button
          id="mobile-hamburger"
          className="md:hidden fixed top-4 left-4 z-30 w-12 h-12 flex items-center justify-center text-primary bg-transparent border-none"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative p-2 hover:bg-muted/50 rounded-xl transition-colors">
            <Menu size={24} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />}
          </div>
        </button>
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-border/50 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:flex md:flex-col shrink-0 transition-all duration-300 shadow-sm`}>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground">
            <ShieldAlert size={18} />
          </div>
          <span className="text-xl font-bold uppercase tracking-tight">{t("admin.portal")}</span>
        </div>

        <div className="p-4 border-b border-border">
          <UserDropdown align="bottom" />
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border-l-4 transition-all ${active ? "bg-primary/5 text-primary border-primary" : "text-slate-500 hover:bg-muted/50 border-transparent hover:text-primary"
                   }`}
              >
                <div className="relative shrink-0">
                  <item.icon size={20} />
                  {item.hasBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-600 rounded-full border-2 border-card" />
                  )}
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            Admin Portal 2D
          </p>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
