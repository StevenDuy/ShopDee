"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, MessageCircle, Package, ClipboardList } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={12} className={s <= Math.round(rating) ? "fill-primary text-primary" : "fill-muted text-muted"} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore(s => s.addItem);
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
    <div className="bg-background text-foreground animate-in fade-in duration-500">
      {/* Mobile Sticky Header - Aligned with Menu Button */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex items-center justify-center px-4 font-black text-xs uppercase tracking-widest text-center truncate">
          {product.title}
        </div>
        <div className="w-14 shrink-0" />
      </div>

      {/* Breadcrumb - 2D Stylization */}
      <div className="border-b-2 border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 h-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <button onClick={() => router.back()} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={12} /> {t("inbox.back")}
          </button>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">{t("products")}</Link>
          {product.category && <><span>/</span><span className="truncate max-w-[100px]">{product.category.name}</span></>}
        </div>
      </div>

    <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">
          
          {/* Gallery - Compact, No Overflow, 2D Style */}
          <div className="space-y-4 w-full max-w-[400px] mx-auto lg:mx-0">
            <div className="aspect-square bg-white border-4 border-primary flex items-center justify-center p-6">
              <img src={images[activeImg].full_url} alt={product.title} className="max-w-full max-h-full object-contain" />
            </div>
            {images.length > 1 && (
              <div 
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                className="flex h-20 gap-3 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing select-none"
              >
                {images.map((img, i) => (
                  <button key={i} 
                    onClickCapture={onClickCapture}
                    onClick={() => setActiveImg(i)}
                    className={`w-20 h-full border-2 shrink-0 transition-colors cursor-grab active:cursor-grabbing ${i === activeImg ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 opacity-70"}`}>
                    <img src={img.full_url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Info - Densely Organized */}
          <div className="space-y-6">
            <div className="space-y-2">
              {product.category && (
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
                  {product.category.parent?.name ? `${product.category.parent.name} / ` : ""}{product.category.name}
                </p>
              )}
              <h1 className="text-xl font-black uppercase tracking-tight leading-tight">{product.title}</h1>
              
              <div className="flex items-center gap-4 py-1">
                <div className="flex items-center gap-2 border-r-2 border-border pr-4">
                  <StarRow rating={avgRating} />
                  <span className="text-[10px] font-bold text-muted-foreground">{avgRating.toFixed(1)}</span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${effectiveStock > 0 ? "text-green-600" : "text-red-600"}`}>
                  <CheckCircle size={12} />
                  {effectiveStock > 0 ? `${t("seller.products_manage.in_stock")} (${effectiveStock})` : t("seller.products_manage.out_of_stock")}
                </div>
              </div>
            </div>

            <div className="bg-muted/30 border-2 border-primary p-4 flex items-baseline gap-3">
              <span className="text-2xl font-black text-primary tracking-tighter">
                {formatPrice(totalPrice)}
              </span>
              {product.sale_price && (
                <>
                  <span className="text-xs text-muted-foreground line-through decoration-primary decoration-2">{formatPrice(product.price)}</span>
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5">-{Math.round((1 - product.sale_price / product.price) * 100)}%</span>
                </>
              )}
            </div>

            {/* Seller Small Card */}
            <div className="border-2 border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 border-2 border-primary flex items-center justify-center font-black text-primary uppercase">
                  {product.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase text-muted-foreground leading-none mb-1">{t("footer.shop")}</p>
                  <Link href={`/shop/${product.seller.id}`} className="text-xs font-black uppercase hover:text-primary">{product.seller.name}</Link>
                </div>
              </div>
              <button 
                onClick={() => { if (!token) router.push("/login?redirect=/products/" + slug); else router.push(`/inbox?userId=${product.seller.id}`); }}
                className="px-3 py-1.5 border-2 border-primary bg-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
                >
                {t("chat")}
              </button>
            </div>

            {/* Options */}
            {options.map((opt, idx) => {
              const sel = selParent[opt.id];
              const locked = idx > 0 && !isGroupComplete(options[idx - 1]);
              return (
                <div key={opt.id} className={`space-y-2 ${locked ? "opacity-30 pointer-events-none" : ""}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{opt.option_name}</p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map(val => (
                      <button key={val.id} 
                        disabled={val.stock_quantity === 0 && !val.sub_values?.length}
                        onClick={() => {
                          setSelParent(p => ({ ...p, [opt.id]: val }));
                          setSelSub(s => { const n = { ...s }; delete n[val.id]; return n; });
                        }}
                        className={`px-3 py-2 border-2 text-[10px] font-bold uppercase transition-colors
                          ${sel?.id === val.id ? "bg-primary text-white border-black" : "bg-card border-border hover:border-black disabled:opacity-30"}`}
                      >
                        {val.option_value}
                      </button>
                    ))}
                  </div>
                  {sel?.sub_values?.length > 0 && (
                    <div className="pl-4 border-l-2 border-primary flex flex-wrap gap-2 pt-1">
                      {sel.sub_values.map(sub => (
                        <button key={sub.id} disabled={sub.stock_quantity === 0}
                          onClick={() => setSelSub(s => ({ ...s, [sel.id]: sub }))}
                          className={`px-2 py-1.5 border-2 text-[10px] font-bold uppercase transition-colors
                            ${selSub[sel.id]?.id === sub.id ? "bg-primary text-white border-black" : "bg-card border-border hover:border-black disabled:opacity-30"}`}
                        >
                          {sub.option_value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Actions */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between border-t-2 border-border pt-4">
                <div className="flex items-center border-2 border-border">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted"><Minus size={14} /></button>
                  <span className="w-12 text-center font-black">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted"><Plus size={14} /></button>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground">{t("product_details.total")}</p>
                  <p className="text-lg font-black text-primary tracking-tighter">{formatPrice(totalPrice * qty)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleAddToCart} disabled={effectiveStock === 0 || !allComplete}
                  className="py-4 border-2 border-primary text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-colors disabled:opacity-30">
                  {addedMsg ? t("added_success") : t("cart")}
                </button>
                <button 
                  onClick={() => { handleAddToCart(); if (allComplete) router.push("/checkout"); }}
                  disabled={effectiveStock === 0 || !allComplete}
                  className="py-4 bg-primary text-white border-2 border-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors disabled:opacity-30">
                  {t("buy_now")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="mt-16 border-4 border-primary bg-card">
          <div className="flex border-b-4 border-primary gap-0 overflow-x-auto no-scrollbar">
            {(["description", "specifications", "reviews"] as const).map(t_id => (
              <button key={t_id} onClick={() => setDetailTab(t_id)}
                className={`flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors border-r-4 last:border-r-0 border-primary
                  ${detailTab === t_id ? "bg-primary text-white" : "bg-muted/20 text-muted-foreground hover:bg-muted"}`}
              >
                {t(`product_details.${t_id}`)}
                {t_id === "reviews" && ` (${reviews.length})`}
              </button>
            ))}
          </div>
          
          <div className="h-[500px] overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {detailTab === "description" && (
              <div className="text-sm py-4 leading-relaxed whitespace-pre-wrap font-medium text-muted-foreground uppercase text-left max-w-2xl mx-auto">
                {product.description || t("product_details.updating_data")}
              </div>
            )}

            {detailTab === "specifications" && (
              <div className="border-2 border-border grid divide-y-2 divide-border">
                {product.attributes.map(attr => (
                  <div key={attr.id} className="grid grid-cols-[140px_1fr]">
                    <div className="p-3 bg-muted/30 text-[9px] font-black uppercase border-r-2 border-border flex items-center">{attr.attribute_name}</div>
                    <div className="p-3 text-[10px] font-bold uppercase px-6">{attr.attribute_value}</div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "reviews" && (
              <div className="space-y-4">
                <div className="p-6 border-4 border-primary bg-muted/10 flex items-center justify-between mb-6 sticky top-0 z-10">
                  <div className="text-4xl font-black text-primary tracking-tighter">{avgRating.toFixed(1)}</div>
                  <div className="text-right">
                    <StarRow rating={avgRating} />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1">{t("product_details.reviews_count", { count: reviews.length })}</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 border-2 border-border bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-black text-[10px] uppercase">{r.customer.name}</p>
                          <p className="text-[8px] text-muted-foreground font-bold">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <StarRow rating={r.rating} />
                      </div>
                      {r.comment && <p className="text-xs font-medium leading-relaxed uppercase pr-4">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
