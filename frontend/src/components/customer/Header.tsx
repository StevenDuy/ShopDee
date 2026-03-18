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
import { useCartStore } from "@/store/useCartStore";
import { UserDropdown } from "@/components/common/UserDropdown";

const navItems = [
  { href: "/",          icon: Home,          labelKey: "home" },
  { href: "/products",  icon: ShoppingBag,   labelKey: "products" },
  { href: "/cart",      icon: ShoppingCart,  labelKey: "cart",    badge: true },
  { href: "/inbox",     icon: MessageCircle, labelKey: "messages" },
  { href: "/orders", icon: Package, labelKey: "my_orders" },
];

export function CustomerHeader() {
  const pathname  = usePathname();
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const [isOpen, setIsOpen] = useState(false);

  // We wait until hydration to avoid text mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {!isOpen && (
        <button 
          className="lg:hidden fixed top-0 left-0 z-[200] w-14 h-[74px] flex items-center justify-center text-primary group"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={28} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky top-0 h-screen w-[240px] flex flex-col bg-card border-r-4 border-primary shrink-0 z-[300] lg:translate-x-0 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section - Aligned with Page Header height */}
        <div className="h-[74px] flex items-center px-6 border-b-2 border-primary bg-muted/50 shrink-0">
          <span className="text-xl font-black text-primary uppercase tracking-tighter">
            ShopDee
          </span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden ml-auto p-2 bg-card border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Area */}
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium border border-transparent ${
                    active ? "bg-primary text-primary-foreground border-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon size={20} />
                    {badge && totalItems > 0 && mounted && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-white">
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

        {/* Footer info */}
        <div className="p-4 border-t border-border">
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
