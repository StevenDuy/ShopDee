"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Package, ShoppingCart, DollarSign, Settings, Store, Menu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

const menuItems = [
  { href: "/seller", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/seller/products", icon: Package, label: "Products" },
  { href: "/seller/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/seller/finance", icon: DollarSign, label: "Finance" },
  { href: "/seller/settings", icon: Settings, label: "Shop Settings" },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:flex md:flex-col shrink-0`}>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Store size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">Seller Center</span>
        </div>

        {user && (
          <div className="p-4 border-b border-border bg-muted/20">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

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

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium hover:bg-destructive/10 text-destructive transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
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
