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
          <div className="border-l border-primary pl-4">
            <h3 className="text-xl font-bold text-primary mb-3 uppercase tracking-tighter">ShopDee</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Shop */}
          <div className="border-l border-muted pl-4">
            <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.shop")}</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/products" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.all_products")}</Link></li>
              <li><Link href="/products?sort=best_sellers" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.best_sellers")}</Link></li>
              <li><Link href="/products?sort=newest" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.new_arrivals")}</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.my_cart")}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="border-l border-muted pl-4">
            <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.account")}</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/profile" className="text-muted-foreground hover:text-foreground hover:underline">{t("profile")}</Link></li>
              <li><Link href="/orders" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.order_history")}</Link></li>
              <li><Link href="/notifications" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.notifications")}</Link></li>
              <li><Link href="/inbox" className="text-muted-foreground hover:text-foreground hover:underline">{t("messages")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="border-l border-muted pl-4">
            <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.support")}</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.help_center")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.return_policy")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.privacy_policy")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground hover:underline">{t("footer.terms_of_service")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground font-medium">© {currentYear} ShopDee. {t("all_rights_reserved")}</p>
          <div className="flex gap-4 text-sm text-muted-foreground font-mono">
            <span>🇻🇳 VN</span>
            <span>|</span>
            <span>{t("currency_vnd")} | {t("currency_usd")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
