"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export function CustomerFooter() {
  const { t } = useTranslation("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-black text-primary mb-3">ShopDee</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your modern e-commerce platform. Shop smart, live better.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link href="/products?sort=best_sellers" className="text-muted-foreground hover:text-foreground transition-colors">Best Sellers</Link></li>
              <li><Link href="/products?sort=newest" className="text-muted-foreground hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">My Cart</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">My Profile</Link></li>
              <li><Link href="/profile/orders" className="text-muted-foreground hover:text-foreground transition-colors">Order History</Link></li>
              <li><Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors">Notifications</Link></li>
              <li><Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">Messages</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Return Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} ShopDee. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>🇻🇳 Vietnam</span>
            <span>•</span>
            <span>VND • USD • EUR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
