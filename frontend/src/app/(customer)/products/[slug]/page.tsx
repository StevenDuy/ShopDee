"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, MessageCircle, Package, ClipboardList } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCart } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { useDragScroll } from "@/hooks/useDragScroll";


interface ProductAttribute { id: number; attribute_name: string; attribute_value: string }
interface ProductMedia { id: number; full_url: string; is_primary: boolean; media_type: string }
interface SubValue { id: number; option_value: string; price_adjustment: number; stock_quantity: number; }
interface OptionValue { id: number; option_value: string; price_adjustment: number; stock_quantity: number; sub_values: SubValue[]; }
interface ProductOption { id: number; option_name: string; values: OptionValue[]; }
interface Review {
  id: number; rating: number; comment: string | null; created_at: string;
  customer: { name: string };
  order_item?: { product: { title: string }; selected_options?: Record<string, string> | null; };
}
interface Product {
  id: number; title: string; slug: string; description: string;
  price: number; sale_price: number | null; stock_quantity: number;
  seller: { id: number; name: string };
  category: { name: string; parent?: { name: string } } | null;
  media: ProductMedia[];
  attributes: ProductAttribute[];
  options: ProductOption[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={10} className={s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { formatPrice } = useCurrencyStore();
  const { addItem } = useCart();
  const { token } = useAuthStore();


  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [selParent, setSelParent] = useState<Record<number, OptionValue>>({});
  const [selSub, setSelSub] = useState<Record<number, SubValue>>({});
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState(false);
  const [detailTab, setDetailTab] = useState<"description" | "specifications" | "reviews">("description");
  const { 
    scrollRef, 
    onMouseDown, 
    onMouseLeave, 
    onMouseUp, 
    onMouseMove, 
    onClickCapture 
  } = useDragScroll();


  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/products/${slug}`)
      .then(r => {
        setProduct(r.data);
        setLoading(false);
        axios.get(`${API}/products/${r.data.id}/reviews`)
          .then(rv => { setReviews(rv.data.data?.data ?? []); setAvgRating(rv.data.avg_rating ?? 0); })
          .catch(() => { });
      })
      .catch(() => router.push("/products"));
  }, [slug, router]);

  if (loading || !product) return null;

  const images = product.media.length > 0 ? product.media : [{ id: 0, full_url: `https://picsum.photos/seed/${product.id}/600/600`, is_primary: true, media_type: "image" }];
  const basePrice = product.sale_price ?? product.price;
  const options = product.options ?? [];

  const isGroupComplete = (opt: ProductOption) => {
    const p = selParent[opt.id];
    if (!p) return false;
    return p.sub_values?.length > 0 ? selSub[p.id] !== undefined : true;
  };
  const allComplete = options.length === 0 || options.every(isGroupComplete);

  const totalPrice = (() => {
    if (!allComplete) return basePrice;
    let sum = 0;
    options.forEach(opt => {
      const p = selParent[opt.id];
      if (p) {
        const sub = selSub[p.id];
        sum += parseFloat(String(sub ? sub.price_adjustment : p.price_adjustment));
      }
    });
    return sum || basePrice;
  })();

  const effectiveStock = (() => {
    if (options.length === 0) return product.stock_quantity;
    if (!allComplete) return product.stock_quantity;
    const stocks = options.map(opt => {
      const p = selParent[opt.id];
      const sub = selSub[p!.id];
      return sub ? sub.stock_quantity : p!.stock_quantity;
    });
    return Math.min(...stocks);
  })();

  const handleAddToCart = () => {
    if (!token) { router.push(`/login?redirect=/products/${slug}`); return; }
    if (!allComplete) return;
    const combinedAttrs: Record<string, string> = {};
    const variantIds: number[] = [];
    options.forEach(opt => {
      const p = selParent[opt.id];
      const sub = selSub[p!.id];
      variantIds.push(sub ? sub.id : p!.id);
      combinedAttrs[opt.option_name] = sub ? `${p!.option_value} / ${sub.option_value}` : p!.option_value;
    });
    addItem({
      id: product.id, productId: product.id, slug: product.slug, title: product.title,
      image: images[activeImg]?.full_url || "", price: totalPrice, salePrice: null,
      sellerId: product.seller.id, sellerName: product.seller.name,
      attributes: combinedAttrs, variantIds, quantity: qty,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  return (
    <div className="bg-background/20 text-foreground animate-in fade-in duration-1000 min-h-screen">
      {/* Breadcrumb - High Fidelity */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/10">
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <button onClick={() => router.back()} className="hover:text-primary transition-all flex items-center gap-1.5">
            <ArrowLeft size={12} strokeWidth={3} /> {t("inbox.back")}
          </button>
          <span className="opacity-20">/</span>
          <Link href="/products" className="hover:text-primary transition-colors">{t("products")}</Link>
          {product.category && (
            <>
              <span className="opacity-20">/</span>
              <span className="truncate max-w-[100px] text-primary">{product.category.name}</span>
            </>
          )}
        </div>
      </div>
 
      <div className="max-w-6xl mx-auto px-6 py-6 font-black uppercase text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 items-start pb-20">
          
          {/* Gallery - Precision Align (Shifted Down Further with Gap Fix) */}
          <div className="space-y-6 w-full sticky top-32 transition-all duration-500">
            <div className="aspect-square bg-white dark:bg-slate-900 border-2 border-border/10 rounded-[2rem] p-6 shadow-2xl flex items-center justify-center group overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <img 
                src={images[activeImg].full_url} 
                alt={product.title} 
                className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110 relative z-10" 
              />
            </div>
            {images.length > 1 && (
              <div 
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                className="flex h-14 gap-3 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing select-none px-1 pt-2"
              >
                {images.map((img, i) => (
                  <button key={i} 
                    onClickCapture={onClickCapture}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-full border-2 shrink-0 transition-all duration-300 rounded-lg overflow-hidden ${i === activeImg ? "border-primary shadow-xl shadow-primary/30 scale-105" : "border-border/10 opacity-60 hover:opacity-100 hover:border-primary/50"}`}>
                    <img src={img.full_url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}
          </div>
 
          {/* Info - High Fidelity Integrated Card */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-4">
            <div className="space-y-3 pb-2">
              {product.category && (
                <p className="text-[9px] font-black uppercase text-primary tracking-[0.5em] opacity-60">
                  {product.category.parent?.name ? `${product.category.parent.name} // ` : ""}{product.category.name}
                </p>
              )}
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-foreground">
                {product.title}
              </h1>
            </div>
 
            {/* Options Selection - Compact Square Boxes */}
            {options.length > 0 && (
              <div className="space-y-4 py-4 border-y border-border/10">
                {options.map((opt, idx) => {
                  const sel = selParent[opt.id];
                  const locked = idx > 0 && !isGroupComplete(options[idx - 1]);
                  return (
                    <div key={opt.id} className={`space-y-2 ${locked ? "opacity-20 pointer-events-none grayscale" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary">OPT{idx + 1}</span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{opt.option_name}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map(val => (
                          <button key={val.id} 
                            disabled={val.stock_quantity === 0 && !val.sub_values?.length}
                            onClick={() => {
                              setSelParent(p => ({ ...p, [opt.id]: val }));
                              setSelSub(s => { const n = { ...s }; delete n[val.id]; return n; });
                            }}
                            className={`px-4 py-2 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300
                              ${sel?.id === val.id 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                                : "bg-muted/30 border-border/20 hover:border-primary/50 text-muted-foreground"}`}
                          >
                            {val.option_value}
                          </button>
                        ))}
                      </div>
                      {sel?.sub_values?.length > 0 && (
                        <div className="pl-6 border-l-2 border-primary/20 flex flex-wrap gap-2 pt-1">
                          {sel.sub_values.map(sub => (
                            <button key={sub.id} disabled={sub.stock_quantity === 0}
                              onClick={() => setSelSub(s => ({ ...s, [sel.id]: sub }))}
                              className={`px-3 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all
                                ${selSub[sel.id]?.id === sub.id 
                                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                                  : "bg-muted border-border/20 hover:border-primary/30 text-muted-foreground"}`}
                            >
                              {sub.option_value}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
  
            {/* Actions Area - Compact & Professional */}
            <div className="space-y-3 pt-0">
              <div className="flex items-center justify-between gap-8 pb-1">
                <div className="flex items-center bg-muted/20 rounded-xl p-0.5 border border-border/10">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"><Minus size={14} strokeWidth={4} /></button>
                  <span className="w-12 text-center font-black text-lg tracking-tighter">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"><Plus size={14} strokeWidth={4} /></button>
                </div>
                <div className="text-right">
                   <div className="flex items-baseline gap-2 justify-end mb-0.5">
                     <p className="text-[9px] font-black text-primary tracking-widest">{formatPrice(totalPrice)}/unit</p>
                     {product.sale_price && <span className="text-[7px] text-muted-foreground line-through decoration-primary opacity-30">{formatPrice(product.price)}</span>}
                   </div>
                  <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(totalPrice * qty)}</p>
                </div>
              </div>
  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={handleAddToCart} disabled={effectiveStock === 0 || !allComplete}
                  className="py-4 rounded-[1.5rem] border-2 border-primary text-primary font-black text-[9px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all duration-500 disabled:opacity-20">
                  {addedMsg ? "DONE" : t("cart")}
                </button>
                <button 
                  onClick={() => { handleAddToCart(); if (allComplete) router.push("/checkout"); }}
                  disabled={effectiveStock === 0 || !allComplete}
                  className="py-4 rounded-[1.5rem] bg-primary text-white border-2 border-primary font-black text-[9px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-20 shadow-xl shadow-primary/30">
                  {t("buy_now")}
                </button>
              </div>
            </div>
  
            {/* Seller Small Card - Simplified */}
            <div className="bg-muted/10 border border-border/5 p-4 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-lg">
                  {product.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Storefront</p>
                  <Link href={`/shop/${product.seller.id}`} className="text-base font-black uppercase hover:text-primary transition-colors tracking-tight">{product.seller.name}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Tabs Section - Vertical Architectural Layout */}
        <div className="max-w-6xl mx-auto py-12 px-6 flex flex-col md:flex-row gap-16 items-start">
          <div className="flex flex-col gap-5 w-full md:w-60 sticky top-32">
            {(["description", "specifications", "reviews"] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`text-left text-[10px] font-black uppercase tracking-[0.3em] transition-all py-2 pl-4 ${detailTab === tab ? "text-primary opacity-100" : "text-muted-foreground opacity-40 hover:opacity-80"}`}
              >
                {t(`product_details.${tab}`)}
              </button>
            ))}
          </div>
          
          <div className="flex-1 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm h-[500px] overflow-y-auto p-6 md:p-8 custom-scrollbar rounded-[2rem] border border-border/5 w-full">
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={detailTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {detailTab === "description" && (
                    <div className="text-[11px] font-bold leading-relaxed whitespace-pre-wrap text-foreground/70 opacity-90 tracking-wide lowercase">
                      {product.description || t("product_details.updating_data")}
                    </div>
                  )}

                  {detailTab === "specifications" && (
                    <div className="grid gap-2">
                      {product.attributes.map(attr => (
                        <div key={attr.id} className="grid grid-cols-[160px_1fr] bg-muted/10 rounded-lg overflow-hidden border border-border/5">
                          <div className="p-2.5 bg-primary/5 text-[8px] font-black uppercase tracking-widest text-primary border-r border-border/5 flex items-center opacity-60">{attr.attribute_name}</div>
                          <div className="p-2.5 text-[10px] font-bold uppercase px-5 flex items-center text-foreground/80">{attr.attribute_value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === "reviews" && (
                    <div className="space-y-5">
                      <div className="p-5 rounded-[1.5rem] bg-primary text-white flex items-center justify-between shadow-lg">
                        <div>
                          <div className="text-3xl font-black tracking-tighter leading-none mb-1">{avgRating.toFixed(1)}</div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Verified Rating</p>
                        </div>
                        <StarRow rating={avgRating} />
                      </div>
                      
                      <div className="grid gap-3">
                        {reviews.map(r => (
                          <div key={r.id} className="p-6 rounded-[1.5rem] border border-border/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-3xl shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-black text-[9px] text-primary">
                                  {r.customer.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-black text-[10px] uppercase tracking-wider text-foreground/80">{r.customer.name}</p>
                                  <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-30">{new Date(r.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <StarRow rating={r.rating} />
                            </div>
                            {r.comment && <div className="text-[10px] font-bold leading-relaxed italic border-l-2 border-primary/10 pl-4 py-1 text-foreground/60">{r.comment}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
