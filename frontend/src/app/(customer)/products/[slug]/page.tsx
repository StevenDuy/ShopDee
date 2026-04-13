"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, MessageCircle, Package, ClipboardList, ChevronRight, ListFilter, Search, X } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCart } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { useDragScroll } from "@/hooks/useDragScroll";
import { EliteCombobox } from "@/components/ui/elite-combobox";


interface ProductAttribute { id: number; attribute_name: string; attribute_value: string }
interface ProductMedia { id: number; full_url: string; is_primary: boolean; media_type: string }
interface SubValue { id: number; option_value: string; price_adjustment: number; stock_quantity: number; }
interface OptionValue { id: number; option_value: string; price_adjustment: number; stock_quantity: number; sub_values: SubValue[]; }
interface ProductOption { id: number; option_name: string; values: OptionValue[]; }
interface Review {
  id: number; rating: number; comment: string | null; created_at: string;
  customer: { name: string };
  order_item?: { product: { title: string }; selected_options?: Record<string, string> | null; };
  resolved_media?: string[];
  media?: string[] | any;
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
  
  const getFullMediaUrl = (url: any) => {
    if (!url) return "";
    if (typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    const baseUrl = API.split("/api")[0];
    if (cleanPath.startsWith("storage/")) return `${baseUrl}/${cleanPath}`;
    return `${baseUrl}/storage/${cleanPath}`;
  };
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
  const [viewingReviewImage, setViewingReviewImage] = useState<string | null>(null);
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
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/10">
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <button onClick={() => router.back()} className="hover:text-primary transition-all flex items-center gap-1.5 focus:outline-none">
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
 
      <div className="max-w-6xl mx-auto px-6 py-4 font-black uppercase text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 items-start pb-6">
          <div className="space-y-6 w-full sticky top-32 transition-all duration-500 z-20">
            <div className="aspect-square bg-white dark:bg-slate-900 border-2 border-border/10 rounded-[2rem] p-6 shadow-2xl flex items-center justify-center group overflow-hidden relative cursor-grab active:cursor-grabbing">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <img src={images[activeImg].full_url} alt={product.title} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110 relative z-10 pointer-events-none" />
            </div>
            {images.length > 1 && (
              <div ref={scrollRef} onMouseDown={onMouseDown} onMouseLeave={onMouseLeave} onMouseUp={onMouseUp} onMouseMove={onMouseMove} className="flex h-14 gap-3 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing select-none px-1 pt-2">
                {images.map((img, i) => (
                  <button key={i} onClickCapture={onClickCapture} onClick={() => setActiveImg(i)} className={`w-14 h-full border-2 shrink-0 transition-all duration-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing ${i === activeImg ? "border-primary shadow-xl shadow-primary/30 scale-105" : "border-border/10 opacity-60 hover:opacity-100 hover:border-primary/50"}`}>
                    <img src={img.full_url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}
          </div>
 
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-4">
            <div className="space-y-3 pb-2">
              {product.category && (
                <p className="text-[9px] font-black uppercase text-primary tracking-[0.5em] opacity-60">
                  {product.category.parent?.name ? `${product.category.parent.name} // ` : ""}{product.category.name}
                </p>
              )}
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-foreground">{product.title}</h1>
            </div>
 
            {options.length > 0 && (
              <div className="space-y-4 py-4 border-y border-border/10">
                {options.map((opt, idx) => {
                  const sel = selParent[opt.id];
                  return (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-primary/10 flex-1" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary opacity-80">
                          {opt.option_name.toLowerCase().includes('option') || opt.option_name.toLowerCase().includes('product') 
                            ? `Option ${idx + 1}` 
                            : opt.option_name}
                        </span>
                        <div className="h-px bg-primary/10 flex-1" />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {opt.values.map(val => (
                          <button key={val.id} disabled={val.stock_quantity === 0 && !val.sub_values?.length} onClick={() => { setSelParent(p => ({ ...p, [opt.id]: val })); setSelSub(s => { const n = { ...s }; delete n[val.id]; return n; }); }} className={`px-4 py-2 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${sel?.id === val.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-muted/30 border-border/20 hover:border-primary/50 text-muted-foreground"}`}>{val.option_value}</button>
                        ))}
                      </div>
                      {sel?.sub_values?.length > 0 && (
                        <div className="pl-6 border-l-2 border-primary/20 flex flex-wrap gap-2 pt-1">
                          {sel.sub_values.map(sub => (
                            <button key={sub.id} disabled={sub.stock_quantity === 0} onClick={() => setSelSub(s => ({ ...s, [sel.id]: sub }))} className={`px-3 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all ${selSub[sel.id]?.id === sub.id ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-muted border-border/20 hover:border-primary/30 text-muted-foreground"}`}>{sub.option_value}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
 
            <div className="space-y-3 pt-0">
              <div className="flex items-center justify-between gap-8 pb-1">
                <div className="flex items-center bg-muted/20 rounded-xl p-0.5 border border-border/10">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"><Minus size={14} strokeWidth={4} /></button>
                  <span className="w-12 text-center font-black text-lg tracking-tighter">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-all"><Plus size={14} strokeWidth={4} /></button>
                </div>
                <div className="text-right">
                   <div className="flex items-baseline gap-2 justify-end mb-1">
                     {product.sale_price && <span className="text-[9px] text-muted-foreground line-through decoration-primary opacity-30 font-bold">{formatPrice(product.price)}</span>}
                     <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <p className="text-[10px] font-black text-primary tracking-widest leading-none">{t("price")}</p>
                     </div>
                   </div>
                  <p className="text-3xl font-black text-primary tracking-tighter leading-none">{formatPrice(totalPrice * qty)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={handleAddToCart} disabled={effectiveStock === 0 || !allComplete} className="py-4 rounded-[1.5rem] border-2 border-primary text-primary font-black text-[9px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all duration-500 disabled:opacity-20">{addedMsg ? t("product_details.done") : t("cart")}</button>
                <button onClick={() => { handleAddToCart(); if (allComplete) router.push("/checkout"); }} disabled={effectiveStock === 0 || !allComplete} className="py-4 rounded-[1.5rem] bg-primary text-white border-2 border-primary font-black text-[9px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-20 shadow-xl shadow-primary/30">{t("buy_now")}</button>
              </div>
            </div>
 
            <div className="bg-muted/10 border border-border/5 p-4 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-lg">{product.seller.name.charAt(0)}</div>
                <div>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t("product_details.storefront_label")}</p>
                  <Link href={`/shop/${product.seller.id}`} className="text-base font-black uppercase hover:text-primary transition-colors tracking-tight">{product.seller.name}</Link>
                </div>
              </div>
            </div>
 
            <div className="pt-6 border-t border-border/10 grid grid-cols-3 gap-2">
              {(["description", "specifications", "reviews"] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`py-3 px-1 rounded-2xl border-2 transition-all duration-500 text-[8px] font-black uppercase tracking-widest text-center ${detailTab === tab ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-muted/30 border-border/10 text-muted-foreground hover:border-primary/50"}`}
                >
                  {t(`product_details.${tab}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
 
        <div className="py-4 animate-in slide-in-from-bottom-5 duration-700 relative z-10">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[3rem] p-10 md:p-14 shadow-2xl h-[700px] overflow-y-auto custom-scrollbar w-full">
            <AnimatePresence mode="wait">
              <motion.div key={detailTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="w-full">
                {detailTab === "description" && (
                  <div className="w-full">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 border-b border-border/10 pb-4">{t("product_details.description")}</h2>
                     <div className="text-sm font-bold leading-relaxed whitespace-pre-wrap text-foreground/70 tracking-wide lowercase italic max-w-5xl">{product.description || t("product_details.updating_data")}</div>
                  </div>
                )}
                {detailTab === "specifications" && (
                  <div className="w-full">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 border-b border-border/10 pb-4">{t("product_details.specifications")}</h2>
                    <div className="flex flex-col gap-4">
                      {product.attributes.map(attr => (
                        <div key={attr.id} className="grid grid-cols-[200px_1fr] bg-muted/5 rounded-2xl overflow-hidden border border-border/5">
                          <div className="p-5 bg-primary/5 text-[9px] font-black uppercase tracking-widest text-primary border-r border-border/5 flex items-center">{attr.attribute_name}</div>
                          <div className="p-5 text-xs font-bold uppercase px-8 flex items-center text-foreground/80">{attr.attribute_value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detailTab === "reviews" && (
                  <div className="w-full space-y-10">
                    <div className="flex items-center justify-between border-b border-border/10 pb-6">
                       <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{t("product_details.reviews")} // {reviews.length} total</h2>
                       <div className="flex items-center gap-6 bg-primary text-white px-6 py-3 rounded-2xl shadow-xl shadow-primary/20">
                          <span className="text-2xl font-black">{avgRating.toFixed(1)}</span>
                          <StarRow rating={avgRating} />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reviews.length === 0 ? (
                        <div className="col-span-full text-center py-24 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{t("product_details.no_reviews") || "No reviews yet"}</p>
                        </div>
                      ) : reviews.map(r => (
                        <div key={r.id} className="p-8 rounded-[2.5rem] border border-border/5 bg-white/20 dark:bg-slate-800/10 backdrop-blur-md relative group hover:bg-white/30 transition-all duration-500">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center font-black text-xs text-primary">{r.customer.name.charAt(0)}</div>
                              <div className="space-y-1">
                                <p className="font-black text-xs uppercase tracking-wider text-foreground/80">{r.customer.name}</p>
                                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{new Date(r.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <StarRow rating={r.rating} />
                          </div>
                          {r.comment && <div className="text-sm font-bold leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2 text-foreground/70">{r.comment}</div>}
                          {(() => {
                            let mediaList: string[] = [];
                            if (Array.isArray(r.resolved_media) && r.resolved_media.length > 0) {
                              mediaList = r.resolved_media;
                            } else if (Array.isArray(r.media) && r.media.length > 0) {
                              mediaList = r.media;
                            } else if (typeof r.media === 'string' && r.media.startsWith('[')) {
                              try {
                                const parsed = JSON.parse(r.media);
                                if (Array.isArray(parsed)) mediaList = parsed;
                              } catch (e) {}
                            }

                            if (mediaList.length === 0) return null;

                            return (
                              <div className="mt-4 flex flex-wrap gap-2">
                                 {mediaList.map((url: string, idx: number) => {
                                   const fullUrl = getFullMediaUrl(url);
                                   return (
                                     <div 
                                       key={idx} 
                                       className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border/10 cursor-pointer shadow-sm bg-muted/40 flex items-center justify-center"
                                       onClick={() => setViewingReviewImage(fullUrl)}
                                     >
                                        <img 
                                          src={fullUrl} 
                                          alt="" 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('picsum.photos')) {
                                              target.src = `https://picsum.photos/seed/${r.id + idx}/200/200`;
                                              target.classList.add('opacity-40', 'grayscale');
                                            }
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                           <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                                              <Search className="text-white" size={14} strokeWidth={3} />
                                           </div>
                                        </div>
                                     </div>
                                   );
                                 })}
                              </div>
                            );
                          })()}
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

      <AnimatePresence>
        {viewingReviewImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-background/95 backdrop-blur-2xl" 
            onClick={() => setViewingReviewImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative max-w-5xl w-full" 
              onClick={e => e.stopPropagation()}
            >
              <img src={viewingReviewImage} alt="Fullscreen" className="w-full h-auto max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border border-border/20" />
              <div className="absolute top-6 right-6">
                <button 
                   onClick={() => setViewingReviewImage(null)}
                   className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all hover:scale-110 active:scale-95"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
