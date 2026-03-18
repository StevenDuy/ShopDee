"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Settings, Store, Menu, MessageCircle } from "lucide-react";
import { useState } from "react";
import { UserDropdown } from "@/components/common/UserDropdown";
import { useTranslation } from "react-i18next";

export function SellerSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: "/seller", icon: LayoutDashboard, label: t("seller.dashboard") },
    { href: "/seller/products", icon: Package, label: t("seller.products") },
    { href: "/seller/orders", icon: ShoppingCart, label: t("seller.orders_nav") },
    { href: "/seller/inbox", icon: MessageCircle, label: t("seller.inbox_nav") },
    { href: "/seller/finance", icon: DollarSign, label: t("seller.finance_nav") },
    { href: "/seller/settings", icon: Settings, label: t("seller.settings_nav") },
  ];

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:flex md:flex-col shrink-0`}>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground">
            <Store size={18} />
          </div>
          <span className="text-xl font-bold uppercase tracking-tight">{t("seller.center")}</span>
        </div>

        <div className="p-4 border-b border-border">
          <UserDropdown align="top" />
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const active = item.href === "/seller" ? pathname === "/seller" : pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border border-transparent ${
                  active ? "bg-primary text-primary-foreground border-primary" : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
            Seller Center 2D
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
