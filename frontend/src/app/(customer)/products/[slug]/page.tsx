"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, Store, ChevronRight } from "lucide-react";
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

  // ── Price calculation ──────────────────────────────────────────────────
  // price_adjustment IS the actual price of this option (not an addition to base)
  // Logic:
  //   - No options              → basePrice
  //   - Options, not all done  → basePrice (preview, nothing locked in)
  //   - All options complete   → SUM of selected option/sub prices
  //     (parent.price_adjustment=0 when has sub → effectively = sub.price_adjustment)

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
      // price_adjustment IS the price (not additive)
      sum += parseFloat(String(sub ? sub.price_adjustment : p.price_adjustment));
    });
    return sum;
  };

  const totalPrice = computeTotalPrice();


  // ── Stock ──────────────────────────────────────────────────────────────
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

  // ── Old-style attribute groups ─────────────────────────────────────────
  const attrGroups: Record<string, string[]> = {};
  product.attributes.forEach(({ attribute_name, attribute_value }) => {
    if (!attrGroups[attribute_name]) attrGroups[attribute_name] = [];
    if (!attrGroups[attribute_name].includes(attribute_value))
      attrGroups[attribute_name].push(attribute_value);
  });

  // ── Select handlers ────────────────────────────────────────────────────
  const handleSelectParent = (optionId: number, value: OptionValue, optionIdx: number) => {
    // Capture OLD parent BEFORE state update (still valid in this closure)
    const oldParent = selParent[optionId];

    setSelParent(prev => {
      const next = { ...prev, [optionId]: value };
      // Clear later groups' parent selections
      options.slice(optionIdx + 1).forEach(o => delete next[o.id]);
      return next;
    });

    setSelSub(prev => {
      const next = { ...prev };
      // ✅ Clear OLD parent value's sub (switching from Red → Blue → clear Red's sub)
      if (oldParent && oldParent.id !== value.id) delete next[oldParent.id];
      // Clear the newly selected value's existing sub (re-select case)
      delete next[value.id];
      // Clear subs for later groups
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

  // ── Cart ───────────────────────────────────────────────────────────────
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
      price: totalPrice,   // ← final total price stored in cart
      salePrice: null,
      sellerId: product.seller.id, sellerName: product.seller.name,
      attributes: combinedAttrs, quantity: qty,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="px-6 md:px-10 py-4 bg-muted/30 border-b border-border flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        {product.category && <><span>/</span><span>{product.category.parent?.name ?? product.category.name}</span></>}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10">

          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img key={activeImg} src={images[activeImg].full_url} alt={product.title}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover" />
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === activeImg ? "border-primary" : "border-border hover:border-muted-foreground"}`}>
                    <img src={img.full_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {product.category && (
              <p className="text-sm text-muted-foreground">
                {product.category.parent?.name ? `${product.category.parent.name} / ` : ""}
                {product.category.name}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold leading-snug">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRow rating={avgRating} />
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} đánh giá)</span>
            </div>

            {/* ── PRICE — always shows the TOTAL ── */}
            <div className="flex items-end gap-4 flex-wrap">
              <span className="text-3xl font-black text-primary">
                {formatPrice(totalPrice)}
              </span>
              {/* Show original crossed-out if on sale */}
              {product.sale_price && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - product.sale_price / product.price) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store size={16} />
              <span>Bán bởi <span className="text-foreground font-medium">{product.seller.name}</span></span>
            </div>

            {/* Stock badge */}
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full
              ${effectiveStock > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700"}`}>
              <CheckCircle size={14} />
              {effectiveStock > 0 ? `Còn hàng (${effectiveStock})` : "Hết hàng"}
            </div>

            {/* ── OPTIONS (sequential) ── */}
            {options.length > 0 && (
              <div className="space-y-4">
                {options.map((opt, optIdx) => {
                  const selectedParent = selParent[opt.id];
                  // Lock if prev group not complete
                  const isLocked = optIdx > 0 && !isGroupComplete(options[optIdx - 1]);
                  const groupDone = isGroupComplete(opt);

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: isLocked ? 0.35 : 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-2xl border p-4 space-y-3 transition-all
                        ${isLocked ? "border-border bg-muted/20 pointer-events-none"
                          : groupDone ? "border-green-500/30 bg-green-50/30 dark:bg-green-900/10"
                            : "border-primary/30 bg-primary/5"}`}
                    >
                      {/* Header */}
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                          ${groupDone ? "bg-green-500 text-white"
                            : isLocked ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"}`}>
                          {groupDone ? "✓" : optIdx + 1}
                        </span>
                        {opt.option_name}
                        {isLocked && <span className="text-xs text-muted-foreground font-normal">(chọn phía trên trước)</span>}
                      </p>

                      {/* Parent value buttons — ALWAYS VISIBLE, radio style */}
                      {!isLocked && (
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map(val => {
                            const outOfStock = val.stock_quantity === 0
                              && (!val.sub_values || val.sub_values.length === 0);
                            const isSelected = selectedParent?.id === val.id;
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => !outOfStock && handleSelectParent(opt.id, val, optIdx)}
                                disabled={outOfStock}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all
                                  ${isSelected
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                    : outOfStock
                                      ? "border-border text-muted-foreground opacity-40 cursor-not-allowed line-through"
                                      : "border-border hover:border-primary/60 hover:bg-primary/5"}`}
                              >
                                {val.option_value}
                                {(!val.sub_values || val.sub_values.length === 0) && parseFloat(String(val.price_adjustment)) > 0 && (
                                  <span className="ml-1.5 text-[11px] font-bold text-primary/70">
                                    +{formatPrice(parseFloat(String(val.price_adjustment)))}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Sub-values — appear ONLY for the currently selected parent that has subs */}
                      {selectedParent && selectedParent.sub_values && selectedParent.sub_values.length > 0 && !isLocked && (
                        <div className="pl-3 border-l-2 border-primary/30 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">
                            Chọn thêm cho &ldquo;{selectedParent.option_value}&rdquo;:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedParent.sub_values.map(sub => {
                              const isSubSelected = selSub[selectedParent.id]?.id === sub.id;
                              const subOutOfStock = sub.stock_quantity === 0;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => !subOutOfStock && handleSelectSub(selectedParent.id, sub)}
                                  disabled={subOutOfStock}
                                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all
                                    ${isSubSelected
                                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                                      : subOutOfStock
                                        ? "border-border text-muted-foreground opacity-40 cursor-not-allowed line-through"
                                        : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                                >
                                  {sub.option_value}
                                  {parseFloat(String(sub.price_adjustment)) > 0 && (
                                    <span className="ml-1 text-[11px] font-bold text-primary/70">
                                      +{formatPrice(parseFloat(String(sub.price_adjustment)))}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hint arrow to next group */}
                      {groupDone && optIdx < options.length - 1 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <ChevronRight size={12} />
                          <span>Tiếp theo: chọn {options[optIdx + 1].option_name}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Old-style attributes */}
            {Object.entries(attrGroups).map(([name, values]) => (
              <div key={name}>
                <p className="text-sm font-medium mb-2">{name}: <span className="text-muted-foreground font-normal">{selAttrs[name] ?? "Chọn"}</span></p>
                <div className="flex flex-wrap gap-2">
                  {values.map(v => (
                    <button key={v} onClick={() => setSelAttrs(a => ({ ...a, [name]: v }))}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${selAttrs[name] === v ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-muted-foreground"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Warning — options not fully selected */}
            {options.length > 0 && !allComplete && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                Vui lòng chọn đầy đủ tùy chọn sản phẩm trước khi thêm vào giỏ.
              </div>
            )}

            {/* Quantity — only show when all options selected */}
            {(options.length === 0 || allComplete) && (
              <div>
                <p className="text-sm font-medium mb-2">Số lượng</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors">
                      <Minus size={16} />
                    </button>
                    <span className="w-14 text-center font-medium">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  {qty > 1 && (
                    <span className="text-sm text-muted-foreground">
                      = <strong className="text-foreground">{formatPrice(totalPrice * qty)}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={effectiveStock === 0 || !allComplete}
                className="flex-1 py-3 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingCart size={18} />
                {addedMsg ? "Đã thêm! ✓" : "Thêm vào giỏ"}
              </button>
              <Link href="/checkout" onClick={handleAddToCart}
                className={`flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                  ${(!allComplete || effectiveStock === 0) ? "opacity-50 pointer-events-none" : ""}`}>
                <Zap size={18} /> Mua ngay
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-muted/40 rounded-2xl p-5">
                <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Đánh giá khách hàng ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl">
              <Star size={32} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có đánh giá nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {review.customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
