"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";

export default function CartPage() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return null;

  const subtotal = totalPrice();
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex items-center justify-center font-black text-sm uppercase tracking-[0.2em]">
          {t("cart_page.title")}
        </div>
        <div className="w-14 shrink-0" />
      </div>

      {items.length === 0 ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 gap-6 text-center">
          <div className="w-24 h-24 border-4 border-dashed border-border flex items-center justify-center rotate-3">
            <ShoppingBag size={48} className="text-muted-foreground opacity-20" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{t("cart_page.empty_cart")}</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("cart_page.empty_desc")}</p>
          </div>
          <Link href="/products" className="px-8 py-4 bg-primary text-white border-2 border-black font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/90 transition-colors">
            {t("cart_page.browse_products")}
          </Link>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="hidden lg:flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b-4 border-primary pb-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                <ShoppingCart size={32} strokeWidth={3} className="text-primary" /> 
                {t("cart_page.title")}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">
                {itemCount} {t("cart_page.items")} {t("cart_page.in_cart")}
              </p>
            </div>
            <button 
              onClick={clearCart} 
              className="self-start md:self-auto text-[10px] font-black uppercase tracking-widest text-destructive border-2 border-destructive px-4 py-2 hover:bg-destructive hover:text-white transition-colors"
            >
              {t("cart_page.clear_all")}
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_350px] gap-10 items-start">
            {/* Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-card border-2 border-border flex flex-col md:flex-row gap-4 p-4 hover:border-primary transition-colors">
                  {/* Image & Main Info */}
                  <div className="flex gap-4 flex-1">
                    <Link href={`/products/${item.slug}`} className="w-20 h-20 md:w-24 md:h-24 bg-white border-2 border-border p-1 shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="font-black text-xs md:text-sm uppercase tracking-tight line-clamp-2 leading-tight mb-1">{item.title}</h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">{t("cart_page.shop_label")}: {item.sellerName}</p>
                      
                      {Object.entries(item.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span key={k} className="text-[8px] font-black uppercase bg-muted px-1.5 py-0.5 border border-border">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between md:flex-col md:justify-center md:items-end gap-4 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-border pt-4 md:pt-0 md:pl-6 shrink-0">
                    <div className="flex flex-col items-start md:items-end">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none mb-1">{t("cart_page.unit_price")}</p>
                      <p className="font-black text-xs text-primary">{formatPrice(item.salePrice ?? item.price)}</p>
                    </div>

                    <div className="flex items-center border-2 border-border bg-background">
                      <button 
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} 
                        className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors border-r-2 border-border"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                        className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors border-l-2 border-border"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="hidden md:flex flex-col items-end">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none mb-1">{t("cart_page.subtotal_item")}</p>
                      <p className="font-black text-sm text-primary">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                    </div>

                    <button 
                      onClick={() => removeItem(item.productId)} 
                      className="text-destructive hover:bg-destructive/10 p-2 transition-colors border-2 border-transparent hover:border-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Box */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-card border-4 border-primary p-6 space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-3">
                  {t("cart_page.summary")}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{t("cart_page.subtotal")} ({itemCount} {t("cart_page.items_count")})</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{t("cart_page.shipping")}</span>
                    <span className={shipping === 0 ? "text-green-600 font-black" : "text-foreground"}>
                      {shipping === 0 ? t("cart_page.free") : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <div className="bg-amber-100 border-l-4 border-amber-500 p-2 text-[8px] font-bold text-amber-700 uppercase leading-relaxed">
                      {t("cart_page.free_shipping_hint", { amount: formatPrice(500000) })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-primary flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-tighter">{t("cart_page.grand_total")}</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">{formatPrice(total)}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <Link href="/checkout"
                    className="w-full py-4 bg-primary text-white border-2 border-primary font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                    {t("cart_page.checkout").toUpperCase()} <ArrowRight size={18} strokeWidth={3} />
                  </Link>
                  <Link href="/products" className="w-full py-2 text-[9px] font-black text-center text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors block underline underline-offset-4 decoration-2">
                    {t("cart_page.continue_shopping")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
