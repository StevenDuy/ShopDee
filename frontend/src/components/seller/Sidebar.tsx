"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Package, ShoppingCart, DollarSign, Settings, Store, Menu, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";
import { UserDropdown } from "@/components/common/UserDropdown";

const menuItems = [
  { href: "/seller", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/seller/products", icon: Package, label: "Products" },
  { href: "/seller/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/seller/inbox", icon: MessageCircle, label: "Inbox" },
  { href: "/seller/finance", icon: DollarSign, label: "Finance" },
  { href: "/seller/settings", icon: Settings, label: "Shop Settings" },
];

import { NavSettings } from "@/components/common/NavSettings";

export function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:flex md:flex-col shrink-0 overflow-visible`}>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Store size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">Seller Center</span>
        </div>

        <div className="p-4 border-b border-border bg-muted/20">
          <UserDropdown align="top" />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const active = item.href === "/seller" ? pathname === "/seller" : pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-foreground/80 hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <p className="text-[10px] text-center text-muted-foreground uppercase opacity-30 font-bold tracking-widest leading-relaxed">
            Seller Center v1.0
          </p>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
