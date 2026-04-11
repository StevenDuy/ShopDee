"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Store, Tag } from "lucide-react";
import { useCart } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { formatPrice } = useCurrencyStore();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return null;

  const subtotal = totalPrice;
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shipping;
  const itemCount = totalItems;

  return (
    <div className="min-h-screen bg-background/20 text-foreground animate-in fade-in duration-1000 pb-20">
      {/* Precision Header — Fluid layout for Sidebar */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/10 mb-10 sticky top-0 z-[100]">
        <div className="px-8 md:px-14 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                <ShoppingCart size={24} strokeWidth={3} />
             </div>
             <div>
                <h1 className="text-base font-black uppercase tracking-[0.4em] text-foreground">{t("cart_page.title")}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
                   {itemCount} {t("cart_page.items")} {t("cart_page.in_cart")}
                </p>
             </div>
          </div>
          {items.length > 0 && (
            <button 
              onClick={clearCart} 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive hover:bg-destructive/10 px-6 py-3 rounded-2xl transition-all border border-destructive/10 hover:border-destructive/30"
            >
              {t("cart_page.clear_all")}
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-10 text-center"
        >
          <div className="relative">
            <div className="w-36 h-36 bg-primary/5 rounded-[4rem] flex items-center justify-center border-4 border-dashed border-primary/20 rotate-6 transform transition-transform hover:rotate-0 duration-700">
              <ShoppingBag size={64} className="text-primary opacity-30" />
            </div>
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
               <Plus size={24} strokeWidth={4} />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-foreground">{t("cart_page.empty_cart")}</h2>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">{t("cart_page.empty_desc")}</p>
          </div>
          <Link href="/products" className="group relative px-12 py-6 overflow-hidden rounded-2xl bg-primary text-white font-black uppercase text-[11px] tracking-[0.5em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40">
            <span className="relative z-10">{t("cart_page.browse_products")}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Link>
        </motion.div>
      ) : (
        <div className="px-8 md:px-14">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
            
            {/* Items List - High Density Cards */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.productId} 
                    className="group bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary transition-colors duration-500" />
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Image Cluster */}
                      <div className="relative shrink-0">
                        <Link href={`/products/${item.slug}`} className="block w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl p-3 border-2 border-border/10 shadow-inner group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                          <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                        </Link>
                         <button 
                          onClick={() => removeItem(item.productId)} 
                          className="absolute -top-2 -left-2 w-8 h-8 bg-destructive text-white rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                        >
                          <Trash2 size={14} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Info & Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-primary tracking-widest opacity-60">
                             <Store size={10} /> {item.sellerName}
                          </div>
                          <Link href={`/products/${item.slug}`} className="block group/title">
                            <h3 className="font-black text-sm uppercase tracking-tight line-clamp-2 leading-tight group-hover/title:text-primary transition-colors">{item.title}</h3>
                          </Link>
                          
                          {Object.entries(item.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {Object.entries(item.attributes).map(([k, v]) => (
                                <span key={k} className="text-[8px] font-black uppercase bg-muted/30 text-muted-foreground px-2.5 py-1 rounded-lg border border-border/5">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Interactive Footer Controls */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/5">
                           <div className="flex items-center bg-muted/20 rounded-xl p-0.5 border border-border/5">
                              <button 
                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"
                              >
                                <Minus size={14} strokeWidth={4} />
                              </button>
                              <span className="w-10 text-center text-xs font-black tracking-tighter">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"
                              >
                                <Plus size={14} strokeWidth={4} />
                              </button>
                           </div>

                           <div className="text-right flex flex-col items-end">
                              <span className="text-[7.5px] font-black uppercase text-primary/60 tracking-[0.2em] mb-1">{t("total")}</span>
                              <p className="text-2xl font-black text-primary tracking-tighter leading-none">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Box - Premium Floating Card */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-4 border-primary/20 rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="space-y-1 relative z-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{t("cart_page.summary")}</h2>
                  <div className="h-1 w-12 bg-primary rounded-full" />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-muted-foreground opacity-60">{t("cart_page.subtotal")} ({itemCount})</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-muted-foreground opacity-60">{t("cart_page.shipping")}</span>
                    <span className={shipping === 0 ? "text-primary font-black" : "text-foreground"}>
                      {shipping === 0 ? t("cart_page.free") : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                     <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                        <Tag size={16} className="text-primary" />
                        <div className="text-[8px] font-black uppercase tracking-widest text-primary/80 leading-relaxed">
                          {t("cart_page.free_shipping_hint", { amount: formatPrice(500000) })}
                        </div>
                     </div>
                  )}
                </div>

                <div className="pt-6 border-t border-border/10">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">{t("cart_page.grand_total")}</span>
                    <span className="text-3xl font-black text-primary tracking-tighter leading-none">{formatPrice(total)}</span>
                  </div>

                  <div className="space-y-4">
                    <Link href="/checkout"
                      className="group w-full py-5 bg-primary text-white font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/30 relative overflow-hidden">
                      <span className="relative z-10">{t("cart_page.checkout")}</span>
                      <ArrowRight size={18} strokeWidth={4} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>
                    
                    <Link href="/products" className="w-full py-4 text-[9px] font-black text-center text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 group">
                      <ShoppingBag size={14} className="group-hover:scale-110 transition-transform" />
                      <span className="uppercase tracking-widest border-b border-transparent group-hover:border-primary transition-all">
                        {t("cart_page.continue_shopping")}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
