"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, Store, ChevronRight, MessageCircle, Package } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

interface ProductAttribute { id: number; attribute_name: string; attribute_value: string }
interface ProductMedia { id: number; full_url: string; is_primary: boolean; media_type: string }

interface SubValue {
  id: number;
  option_value: string;
  price_adjustment: number;
  stock_quantity: number;
}

interface OptionValue {
  id: number;
  option_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sub_values: SubValue[];  // top-level values only; sub_values may be empty array
}

interface ProductOption {
  id: number;
  option_name: string;
  values: OptionValue[];   // only top-level (parent_id = null)
}

interface Review {
  id: number; rating: number; comment: string | null;
  created_at: string;
  customer: { name: string };
  media?: string[];
  resolved_media?: string[];
  order_item?: {
    product: { title: string };
    selected_options?: Record<string, string> | null;
  };
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

const API = "http://localhost:8000/api";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={14}
          className={s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore(s => s.addItem);
  const { token } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [selAttrs, setSelAttrs] = useState<Record<string, string>>({});

  // selParent: { [optionId]: OptionValue }
  const [selParent, setSelParent] = useState<Record<number, OptionValue>>({});
  // selSub: { [parentValueId]: SubValue } — one sub selected per parent value
  const [selSub, setSelSub] = useState<Record<number, SubValue>>({});

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState(false);
  const [detailTab, setDetailTab] = useState<"description" | "reviews">("description");

  useEffect(() => {
    setLoading(true);
    setSelParent({});
    setSelSub({});
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
  if (!product) return null;

  const images = product.media.length > 0
    ? product.media
    : [{ id: 0, full_url: `https://picsum.photos/seed/${product.id}/600/600`, is_primary: true, media_type: "image" }];

  const basePrice = product.sale_price ?? product.price;
  const options = product.options ?? [];

  const isGroupComplete = (opt: ProductOption) => {
    const p = selParent[opt.id];
    if (!p) return false;
    const hasSubs = p.sub_values && p.sub_values.length > 0;
    if (hasSubs) return selSub[p.id] !== undefined;
    return true;
  };

  const allComplete = options.length === 0 || options.every(isGroupComplete);

  const computeTotalPrice = (): number => {
    if (options.length === 0) return basePrice;
    if (!allComplete) return basePrice;
    let sum = 0;
    options.forEach(opt => {
      const p = selParent[opt.id];
      if (!p) return;
      const sub = selSub[p.id];
      sum += parseFloat(String(sub ? sub.price_adjustment : p.price_adjustment));
    });
    return sum;
  };

  const totalPrice = computeTotalPrice();

  let effectiveStock = product.stock_quantity;
  if (options.length > 0 && allComplete) {
    const stocks: number[] = [];
    options.forEach(opt => {
      const p = selParent[opt.id];
      if (p) {
        const sub = selSub[p.id];
        stocks.push(sub ? sub.stock_quantity : p.stock_quantity);
      }
    });
    if (stocks.length > 0) effectiveStock = Math.min(...stocks);
  }

  const attrGroups: Record<string, string[]> = {};
  product.attributes.forEach(({ attribute_name, attribute_value }) => {
    if (!attrGroups[attribute_name]) attrGroups[attribute_name] = [];
    if (!attrGroups[attribute_name].includes(attribute_value))
      attrGroups[attribute_name].push(attribute_value);
  });

  const handleSelectParent = (optionId: number, value: OptionValue, optionIdx: number) => {
    const oldParent = selParent[optionId];

    setSelParent(prev => {
      const next = { ...prev, [optionId]: value };
      options.slice(optionIdx + 1).forEach(o => delete next[o.id]);
      return next;
    });

    setSelSub(prev => {
      const next = { ...prev };
      if (oldParent && oldParent.id !== value.id) delete next[oldParent.id];
      delete next[value.id];
      options.slice(optionIdx + 1).forEach(o => {
        const pp = selParent[o.id];
        if (pp) delete next[pp.id];
      });
      return next;
    });
  };

  const handleSelectSub = (parentValueId: number, sub: SubValue) => {
    setSelSub(prev => ({ ...prev, [parentValueId]: sub }));
  };

  const handleAddToCart = () => {
    if (!token) { router.push("/login?redirect=/products/" + slug); return; }
    if (!allComplete) return;

    const combinedAttrs: Record<string, string> = { ...selAttrs };
    options.forEach(opt => {
      const p = selParent[opt.id];
      if (p) {
        const sub = selSub[p.id];
        combinedAttrs[opt.option_name] = sub ? `${p.option_value} / ${sub.option_value}` : p.option_value;
      }
    });

    addItem({
      id: product.id, productId: product.id, slug: product.slug,
      title: product.title, image: images[activeImg].full_url,
      price: totalPrice,
      salePrice: null,
      sellerId: product.seller.id, sellerName: product.seller.name,
      attributes: combinedAttrs, quantity: qty,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb - Hidden on mobile */}
      <div className="hidden md:flex px-10 py-4 bg-muted/30 border-b border-border items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        {product.category && <><span>/</span><span>{product.category.parent?.name ?? product.category.name}</span></>}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="px-4 md:px-10 py-6 md:py-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">

          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-inner border border-border/50">
              <AnimatePresence mode="wait">
                <motion.img key={activeImg} src={images[activeImg].full_url} alt={product.title}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover" />
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all shadow-sm ${i === activeImg ? "border-primary scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={img.full_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-3">
              {product.category && (
                <p className="text-[10px] md:text-xs font-black uppercase text-primary tracking-[0.2em] opacity-80">
                  {product.category.parent?.name ? `${product.category.parent.name} / ` : ""}
                  {product.category.name}
                </p>
              )}
              <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-tight uppercase text-balance">{product.title}</h1>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                  <StarRow rating={avgRating} />
                  <span className="text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-wider">{avgRating.toFixed(1)} ({reviews.length})</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
                  ${effectiveStock > 0 ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                  <CheckCircle size={12} />
                  {effectiveStock > 0 ? `Sẵn hàng (${effectiveStock})` : "Tam hết"}
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-bold text-primary tracking-tighter drop-shadow-sm">
                {formatPrice(totalPrice)}
              </span>
              {product.sale_price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm md:text-lg text-muted-foreground line-through opacity-40 italic">{formatPrice(product.price)}</span>
                  <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">
                    -{Math.round((1 - product.sale_price / product.price) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4 flex items-center justify-between group shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg md:text-xl border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all cursor-pointer shadow-inner"
                  onClick={() => router.push(`/shop/${product.seller.id}`)}>
                  {product.seller.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1 opacity-60">Cửa hàng</p>
                  <Link href={`/shop/${product.seller.id}`} className="text-sm md:text-base font-bold text-foreground hover:text-primary transition-colors block truncate pr-2">
                    {product.seller.name}
                  </Link>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (!token) { router.push(`/login?redirect=/products/${slug}`); return; }
                  router.push(`/inbox?userId=${product.seller.id}`);
                }}
                className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 active:scale-95 shadow-sm"
              >
                <MessageCircle size={16} /> <span className="hidden md:inline uppercase tracking-widest">Chat ngay</span><span className="md:hidden">CHAT</span>
              </button>
            </div>

            {/* ── OPTIONS (sequential) ── */}
            {options.length > 0 && (
              <div className="space-y-5">
                {options.map((opt, optIdx) => {
                  const selectedParent = selParent[opt.id];
                  const isLocked = optIdx > 0 && !isGroupComplete(options[optIdx - 1]);
                  const groupDone = isGroupComplete(opt);

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isLocked ? 0.4 : 1, y: 0 }}
                      className={`rounded-2xl border p-4 md:p-5 space-y-4 transition-all
                        ${isLocked ? "border-border bg-muted/20 grayscale pointer-events-none"
                          : groupDone ? "border-green-500/10 bg-green-500/[0.02] shadow-sm"
                            : "border-primary/10 bg-primary/[0.02] shadow-sm"}`}
                    >
                      <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm
                          ${groupDone ? "bg-green-500 text-white"
                            : isLocked ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"}`}>
                          {groupDone ? "✓" : optIdx + 1}
                        </span>
                        {opt.option_name}
                      </p>

                      {!isLocked && (
                        <div className="flex flex-wrap gap-2.5">
                          {opt.values.map(val => {
                            const outOfStock = val.stock_quantity === 0 && (!val.sub_values || val.sub_values.length === 0);
                            const isSelected = selectedParent?.id === val.id;
                            return (
                              <button key={val.id} onClick={() => !outOfStock && handleSelectParent(opt.id, val, optIdx)} disabled={outOfStock}
                                className={`px-4 py-2 rounded-xl border text-xs md:text-sm font-bold transition-all active:scale-95 shadow-sm
                                  ${isSelected 
                                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                    : outOfStock ? "opacity-30 border-dashed cursor-not-allowed line-through grayscale" : "bg-card hover:border-primary/40"}`}>
                                {val.option_value}
                                {(!val.sub_values || val.sub_values.length === 0) && parseFloat(String(val.price_adjustment)) > 0 && (
                                  <span className={`ml-2 text-[10px] opacity-70 ${isSelected ? "text-white" : "text-primary"}`}>
                                    +{formatPrice(parseFloat(String(val.price_adjustment)))}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedParent?.sub_values?.length > 0 && !isLocked && (
                        <div className="pt-2 pl-5 border-l-2 border-primary/20 space-y-4">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest underline decoration-2 underline-offset-4">Chọn {selectedParent.option_value}:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedParent.sub_values.map(sub => {
                              const isSubSelected = selSub[selectedParent.id]?.id === sub.id;
                              const subOutOfStock = sub.stock_quantity === 0;
                              return (
                                <button key={sub.id} onClick={() => !subOutOfStock && handleSelectSub(selectedParent.id, sub)} disabled={subOutOfStock}
                                  className={`px-4 py-2.5 rounded-xl border text-[10px] md:text-xs font-black transition-all shadow-sm
                                    ${isSubSelected ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/10" : subOutOfStock ? "opacity-20 line-through" : "bg-card hover:border-primary/30"}`}>
                                  {sub.option_value}
                                  {parseFloat(String(sub.price_adjustment)) > 0 && (
                                    <span className="ml-1 opacity-70">+{formatPrice(parseFloat(String(sub.price_adjustment)))}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}


            {!allComplete && options.length > 0 && (
              <div className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-center text-center">
                Vui lòng hoàn tất lựa chọn sản phẩm
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-4">
              {(options.length === 0 || allComplete) && (
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Số lượng</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"><Minus size={14} /></button>
                      <span className="w-10 text-center text-sm md:text-base font-bold">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))} className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"><Plus size={14} /></button>
                    </div>
                  </div>
                  {qty > 1 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tổng tạm tính</p>
                      <p className="text-lg md:text-xl font-bold text-primary tracking-tighter">{formatPrice(totalPrice * qty)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 md:gap-4">
                <button onClick={handleAddToCart} disabled={effectiveStock === 0 || !allComplete}
                  className="flex-1 py-3.5 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-bold text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:grayscale active:scale-95 shadow-md shadow-primary/5">
                  <ShoppingCart size={18} />
                  {addedMsg ? "ĐÃ THÊM! ✓" : "GIỎ HÀNG"}
                </button>
                <Link href="/checkout" onClick={handleAddToCart}
                  className={`flex-1 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/30
                    ${(!allComplete || effectiveStock === 0) ? "opacity-30 grayscale pointer-events-none" : ""}`}>
                  <Zap size={18} /> MUA NGAY
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- Tabs Section --- */}
        <div className="mt-12 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="flex border-b border-border bg-muted/20 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: "description", label: "MÔ TẢ", icon: Package },
              { id: "reviews",     label: `ĐÁNH GIÁ (${reviews.length})`, icon: Star },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setDetailTab(tab.id as any)}
                className={`flex items-center gap-2 px-8 py-5 text-xs md:text-sm font-bold tracking-widest transition-all relative shrink-0
                  ${detailTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <tab.icon size={16} />
                {tab.label}
                {detailTab === tab.id && <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              {detailTab === "description" && (
                <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl mx-auto">
                  <h3 className="text-xl md:text-2xl font-bold text-primary tracking-tighter uppercase italic">Câu chuyện sản phẩm</h3>
                  {product.description ? (
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-justify italic">
                      {product.description}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic font-medium opacity-60 uppercase text-center py-10">Dữ liệu đang được cập nhật...</p>
                  )}
                </motion.div>
              )}


              {detailTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                  <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-inner">
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-bold text-primary tracking-tighter uppercase">Xếp hạng</h3>
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1 italic opacity-60">Dựa trên trải nghiệm thực tế</p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                      <div className="flex items-center gap-4 bg-card px-6 py-4 rounded-2xl shadow-sm border border-border">
                         <span className="text-3xl md:text-4xl font-bold text-primary leading-none tracking-tighter">{avgRating.toFixed(1)}</span>
                         <StarRow rating={avgRating} />
                      </div>
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60 italic">{reviews.length} khách hàng đã đánh giá</span>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-20 grayscale opacity-20">
                      <Star size={80} className="mx-auto mb-6" />
                      <p className="font-black uppercase tracking-[0.5em] text-xs">Waiting for first review</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                           <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner border border-primary/10">
                                {review.customer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm uppercase tracking-tight">{review.customer.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic opacity-40">{new Date(review.created_at).toLocaleDateString()}</p>
                                  <span className="text-[10px] text-primary/60 font-black uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                    🏷️ {review.order_item?.product?.title || 'Đã mua hàng'}
                                    {review.order_item?.selected_options && Object.keys(review.order_item.selected_options).length > 0 && (
                                        <span className="ml-1 opacity-70">
                                            ({Object.entries(review.order_item.selected_options).map(([k,v]) => `${k}: ${v}`).join(', ')})
                                        </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/5">
                              <StarRow rating={review.rating} />
                            </div>
                          </div>
                          {review.comment && (
                            <div className="relative">
                              <p className="text-sm md:text-base text-muted-foreground leading-relaxed italic font-medium pr-4 break-words pl-2">
                                {review.comment}
                              </p>
                            </div>
                          )}

                          {review.media && (review.resolved_media || review.media || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 ml-2">
                              {(review.resolved_media || review.media || []).map((url: string, i: number) => (
                                <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-border/50 group cursor-zoom-in">
                                  {url.includes('.mp4') || url.includes('.mov') ? (
                                    <video src={url} className="w-full h-full object-cover" controls={false} />
                                  ) : (
                                    <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  )}
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                      <Plus size={16} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
