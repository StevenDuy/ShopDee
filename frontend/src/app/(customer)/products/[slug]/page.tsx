"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Zap, ArrowLeft, Plus, Minus, CheckCircle, Store } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

interface ProductAttribute { id: number; attribute_name: string; attribute_value: string }
interface ProductMedia { id: number; full_url: string; is_primary: boolean; media_type: string }
interface Review {
  id: number; rating: number; comment: string | null;
  created_at: string;
  customer: { name: string; profile?: { avatar_url: string | null } };
}
interface Product {
  id: number; title: string; slug: string; description: string;
  price: number; sale_price: number | null; stock_quantity: number; sku: string;
  seller: { id: number; name: string };
  category: { name: string; parent?: { name: string } } | null;
  media: ProductMedia[];
  attributes: ProductAttribute[];
}

const API = "http://localhost:8000/api";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
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
  const addItem = useCartStore((s) => s.addItem);
  const { token } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [selAttrs, setSelAttrs] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/products/${slug}`).then((r) => { setProduct(r.data); setLoading(false); }).catch(() => router.push("/products"));
    axios.get(`${API}/products/${slug}/reviews`).then((r) => { setReviews(r.data.data?.data ?? []); setAvgRating(r.data.avg_rating ?? 0); }).catch(() => { });
  }, [slug, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!product) return null;

  const images = product.media.length > 0 ? product.media : [{ id: 0, full_url: `https://picsum.photos/seed/${product.id}/600/600`, is_primary: true, media_type: "image" }];
  const price = product.sale_price ?? product.price;

  // Group attributes by name
  const attrGroups: Record<string, string[]> = {};
  product.attributes.forEach(({ attribute_name, attribute_value }) => {
    if (!attrGroups[attribute_name]) attrGroups[attribute_name] = [];
    if (!attrGroups[attribute_name].includes(attribute_value)) attrGroups[attribute_name].push(attribute_value);
  });

  const handleAddToCart = () => {
    if (!token) {
      router.push("/login?redirect=" + `/products/${slug}`);
      return;
    }
    addItem({ id: product.id, productId: product.id, title: product.title, image: images[activeImg].full_url, price: product.price, salePrice: product.sale_price, sellerId: product.seller.id, sellerName: product.seller.name, attributes: selAttrs, quantity: qty });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

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
        <span>/</span><span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img key={activeImg} src={images[activeImg].full_url} alt={product.title}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover" />
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
          <div className="space-y-6">
            {product.category && (
              <p className="text-sm text-muted-foreground">{product.category.parent?.name ? `${product.category.parent.name} / ` : ""}{product.category.name}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold leading-snug">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRow rating={avgRating} />
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-primary">{formatPrice(price)}</span>
              {product.sale_price && (
                <div>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                  <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - product.sale_price / product.price) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store size={16} />
              <span>Sold by <span className="text-foreground font-medium">{product.seller.name}</span></span>
            </div>

            {/* Stock */}
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${product.stock_quantity > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
              <CheckCircle size={14} /> {product.stock_quantity > 0 ? `In stock (${product.stock_quantity} available)` : "Out of stock"}
            </div>

            {/* Attributes */}
            {Object.entries(attrGroups).map(([name, values]) => (
              <div key={name}>
                <p className="text-sm font-medium mb-2">{name}: <span className="text-muted-foreground font-normal">{selAttrs[name] ?? "Select"}</span></p>
                <div className="flex flex-wrap gap-2">
                  {values.map((v) => (
                    <button key={v} onClick={() => setSelAttrs(a => ({ ...a, [name]: v }))}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${selAttrs[name] === v ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-muted-foreground"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"><Minus size={16} /></button>
                  <span className="w-14 text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"><Plus size={16} /></button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock_quantity === 0}
                className="flex-1 py-3 border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                <ShoppingCart size={18} />
                {addedMsg ? "Added! ✓" : "Add to Cart"}
              </button>
              <Link href="/checkout" onClick={handleAddToCart}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Zap size={18} /> Buy Now
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-muted/40 rounded-2xl p-5">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Customer Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl">
              <Star size={32} className="mx-auto mb-3 opacity-30" />
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
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
