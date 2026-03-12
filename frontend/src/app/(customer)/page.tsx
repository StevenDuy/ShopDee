"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
import { useTranslation } from "react-i18next";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  sale_price: number | null;
  category: { name: string } | null;
  media: { url: string; is_primary: boolean }[];
  seller_id: number;
}

const API = "http://localhost:8000/api";
const BANNERS = [
  { title: "Mua sắm thông minh", subtitle: "Hàng ngàn sản phẩm chờ bạn khám phá", color: "from-violet-600 to-indigo-600", emoji: "🛍️" },
  { title: "Ưu đãi hôm nay",     subtitle: "Giảm đến 50% cho đơn hàng đầu tiên",  color: "from-rose-600 to-pink-600",   emoji: "🎉" },
  { title: "Giao hàng nhanh",   subtitle: "Nhận hàng trong 24h toàn quốc",         color: "from-emerald-600 to-teal-600", emoji: "🚀" },
];

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);
  const img = product.media.find((m) => m.is_primary)?.url ?? product.media[0]?.url ?? "https://picsum.photos/300/300";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group"
    >
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.sale_price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - product.sale_price / product.price) * 100)}%
          </span>
        )}
      </Link>
      <div className="p-4">
        {product.category && <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>}
        <h3 className="font-semibold text-sm line-clamp-2 mb-3 leading-snug">{product.title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-primary">{formatPrice(product.sale_price ?? product.price)}</span>
          {product.sale_price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={12} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
        </div>
        <button
          onClick={() => addItem({ id: product.id, productId: product.id, title: product.title, image: img, price: product.price, salePrice: product.sale_price, sellerId: product.seller_id, sellerName: "", attributes: {} })}
          className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart size={15} /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, products, href }: { title: string; icon: React.ElementType; products: Product[]; href: string }) {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon size={22} className="text-primary" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <Link href={href} className="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity">
          View all <ArrowRight size={16} />
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl aspect-square animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

export default function CustomerHomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    axios.get(`${API}/products?sort=newest&limit=8&status=active`).then((r) => setNewArrivals(r.data.data ?? r.data ?? [])).catch(() => {});
    axios.get(`${API}/products?sort=best_sellers&limit=8&status=active`).then((r) => setBestSellers(r.data.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className={`relative h-64 md:h-80 bg-gradient-to-r ${banner.color} flex items-center overflow-hidden`}>
        <motion.div
          key={bannerIdx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5 }}
          className="px-10 z-10"
        >
          <div className="text-6xl mb-4">{banner.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{banner.title}</h1>
          <p className="text-white/80 text-lg mb-6">{banner.subtitle}</p>
          <Link href="/products"
            className="inline-flex items-center gap-2 bg-white text-foreground px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors">
            Shop Now <ArrowRight size={18} />
          </Link>
        </motion.div>

        {/* Dots */}
        <div className="absolute bottom-4 left-10 flex gap-2">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? "bg-white w-6" : "bg-white/40"}`} />
          ))}
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -right-10 bottom-0 w-40 h-40 bg-white/10 rounded-full" />
      </div>

      {/* Product Sections */}
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <Section title="Best Sellers" icon={TrendingUp} products={bestSellers} href="/products?sort=best_sellers" />
        <Section title="New Arrivals"  icon={Sparkles}   products={newArrivals}  href="/products?sort=newest" />
      </div>
    </div>
  );
}
