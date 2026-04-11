"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home, ShoppingBag, ShoppingCart, MessageCircle,
  Menu, X, Package
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/store/useCartStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { UserDropdown } from "@/components/common/UserDropdown";

const navItems = [
  { href: "/",          icon: Home,          labelKey: "home" },
  { href: "/products",  icon: ShoppingBag,   labelKey: "products" },
  { href: "/cart",      icon: ShoppingCart,  labelKey: "cart",    badge: true },
  { href: "/inbox",     icon: MessageCircle, labelKey: "messages", notificationBadge: true },
  { href: "/orders", icon: Package, labelKey: "my_orders" },
];

export function CustomerHeader() {
  const pathname  = usePathname();
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { totalItems } = useCart();

  const { unreadCount, hasUnreadMessages, fetchUnreadCounts } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUnreadCounts(token);
    }
  }, [token]);

  // We wait until hydration to avoid text mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {!isOpen && (
        <button 
          id="mobile-hamburger"
          className="lg:hidden fixed top-0 left-0 z-[200] w-14 h-[74px] flex items-center justify-center text-primary group"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <Menu size={28} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
            { (unreadCount > 0 || hasUnreadMessages) && mounted && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky top-0 h-screen w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-border/50 shrink-0 z-[300] lg:translate-x-0 transition-all duration-300 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-border/50 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground">
            <Home size={18} />
          </div>
          <span className="text-xl font-bold uppercase tracking-tight text-primary italic">ShopDee</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden ml-auto p-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
 
        {/* User Profile Area */}
        <div className="p-4 border-b border-border/50">
          <UserDropdown align="bottom" />
        </div>
 
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems
            .filter(item => {
              if (!token) {
                return ["/", "/products"].includes(item.href);
              }
              return true;
            })
            .map(({ href, icon: Icon, labelKey, badge, notificationBadge }: any) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border-l-4 transition-all ${
                    active ? "bg-primary/5 text-primary border-primary" : "text-slate-500 hover:bg-muted/50 border-transparent hover:text-primary"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon size={20} />
                    {badge && totalItems > 0 && mounted && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold min-w-[15px] h-[15px] flex items-center justify-center px-1 border-2 border-background rounded-full">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                    {notificationBadge && (unreadCount > 0 || hasUnreadMessages) && mounted && (
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-600 rounded-full border-2 border-background animate-pulse shadow-sm" />
                    )}
                  </span>
                  <span>
                    {mounted ? t(labelKey as string) : ""}
                  </span>
                </Link>
              );
            })}
        </nav>
 
        {/* Footer info */}
        <div className="p-4 border-t border-border/50 mt-auto">
          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            ShopDee 2D
          </p>
        </div>
      </aside>
 
      {/* Overlay - simplified without framer-motion */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
    </>
  );
}
