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
              {t("footer.tagline")}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.shop")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.all_products")}</Link></li>
              <li><Link href="/products?sort=best_sellers" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.best_sellers")}</Link></li>
              <li><Link href="/products?sort=newest" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.new_arrivals")}</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.my_cart")}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.account")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">{t("profile")}</Link></li>
              <li><Link href="/orders" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.order_history")}</Link></li>
              <li><Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.notifications")}</Link></li>
              <li><Link href="/inbox" className="text-muted-foreground hover:text-foreground transition-colors">{t("messages")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.help_center")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.return_policy")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacy_policy")}</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.terms_of_service")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} ShopDee. {t("all_rights_reserved")}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>🇻🇳 Vietnam</span>
            <span>•</span>
            <span>{t("currency_vnd")} • {t("currency_usd")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
