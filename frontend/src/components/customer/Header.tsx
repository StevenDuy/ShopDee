"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, ShoppingBag, ShoppingCart, MessageCircle,
  Bell, User, LogOut, ChevronRight, Moon, Sun,
  Globe, DollarSign, Menu, X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

import { UserDropdown } from "@/components/common/UserDropdown";

const navItems = [
  { href: "/",          icon: Home,          labelKey: "home" },
  { href: "/products",  icon: ShoppingBag,   labelKey: "products" },
  { href: "/cart",      icon: ShoppingCart,  labelKey: "cart",    badge: true },
  { href: "/chat",      icon: MessageCircle, labelKey: "chat" },
  { href: "/notifications", icon: Bell,      labelKey: "alerts" },
  { href: "/profile",   icon: User,          labelKey: "profile" },
];

export function CustomerHeader() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi");

  // We wait until hydration to avoid text mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen flex flex-col bg-card border-r border-border sticky top-0 shrink-0 overflow-visible z-50"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xl font-black text-primary tracking-tight"
            >
              ShopDee
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(c => !c)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* User Dropdown */}
      <div className="px-3 py-4 border-b border-border">
        <UserDropdown collapsed={collapsed} align="top" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(({ href, icon: Icon, labelKey, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
              }`}
            >
              <span className="relative shrink-0">
                <Icon size={20} />
                {badge && totalItems > 0 && mounted && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {mounted ? t(labelKey as string) : ""}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info or anything else if needed */}
      <div className="p-4">
        <p className="text-[10px] text-center text-muted-foreground uppercase opacity-50 font-bold tracking-widest leading-relaxed">
          Powered by <br/> Antigravity
        </p>
      </div>
    </motion.aside>
  );
}
