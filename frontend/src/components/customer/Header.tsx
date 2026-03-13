"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, ShoppingBag, ShoppingCart, MessageCircle,
  Bell, User, LogOut, Moon, Sun,
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
  { href: "/inbox",     icon: MessageCircle, labelKey: "messages" },
  { href: "/profile",   icon: User,          labelKey: "profile" },
];

export function CustomerHeader() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, token, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi");

  // We wait until hydration to avoid text mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-card border border-border rounded-xl shadow-md text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky top-0 h-screen w-[240px] flex flex-col bg-card border-r border-border shrink-0 z-50 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span className="text-xl font-black text-primary tracking-tight">
            ShopDee
          </span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Dropdown */}
        <div className="px-3 py-4 border-b border-border">
          <UserDropdown collapsed={false} align="top" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          {navItems
            .filter(item => {
              if (!token) {
                return ["/", "/products"].includes(item.href);
              }
              return true;
            })
            .map(({ href, icon: Icon, labelKey, badge }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent text-foreground"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon size={20} />
                    {badge && totalItems > 0 && mounted && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </span>
                  <span>
                    {mounted ? t(labelKey as string) : ""}
                  </span>
                </Link>
              );
            })}
        </nav>

        {/* Bottom Info */}
        <div className="p-6 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground uppercase opacity-40 font-bold tracking-widest leading-relaxed">
            Powered by <br/> Antigravity
          </p>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
