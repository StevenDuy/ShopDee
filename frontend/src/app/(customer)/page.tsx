"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  sale_price: number | null;
  category: { name: string } | null;
  media: { full_url: string; is_primary: boolean }[];
  seller_id: number;
}

const API = "http://localhost:8000/api";
const BANNERS = [
  { title: "Mua sắm thông minh", subtitle: "Hàng ngàn sản phẩm chờ bạn khám phá", color: "from-violet-600 to-indigo-600", emoji: "🛍️" },
  { title: "Ưu đãi hôm nay", subtitle: "Giảm đến 50% cho đơn hàng đầu tiên", color: "from-rose-600 to-pink-600", emoji: "🎉" },
  { title: "Giao hàng nhanh", subtitle: "Nhận hàng trong 24h toàn quốc", color: "from-emerald-600 to-teal-600", emoji: "🚀" },
];

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrencyStore();
  const img = product.media.find((m) => m.is_primary)?.full_url ?? product.media[0]?.full_url ?? "https://picsum.photos/300/300";

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div
        whileHover={{ y: -6, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-card border border-border rounded-2xl overflow-hidden group h-full flex flex-col transition-shadow"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {product.sale_price && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              -{Math.round((1 - product.sale_price / product.price) * 100)}%
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          {product.category && <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 opacity-70">{product.category.name}</p>}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">{product.title}</h3>

          <div className="mt-auto flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{formatPrice(product.sale_price ?? product.price)}</span>
              {product.sale_price && (
                <span className="text-xs text-muted-foreground line-through opacity-50">{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">(4.0)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
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
    axios.get(`${API}/products?sort=newest&limit=8&status=active`).then((r) => setNewArrivals(r.data.data ?? r.data ?? [])).catch(() => { });
    axios.get(`${API}/products?sort=best_sellers&limit=8&status=active`).then((r) => setBestSellers(r.data.data ?? r.data ?? [])).catch(() => { });
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <Link href="/products" className="block p-6 md:p-10">
        <div className={`relative h-64 md:h-80 bg-gradient-to-r ${banner.color} rounded-3xl flex items-center overflow-hidden cursor-pointer group shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]`}>
          <motion.div
            key={bannerIdx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="px-10 z-10"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500">{banner.emoji}</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{banner.title}</h1>
            <p className="text-white/90 text-xl font-medium">{banner.subtitle}</p>
          </motion.div>

          {/* Dots */}
          <div className="absolute bottom-6 left-10 flex gap-2 z-20">
            {BANNERS.map((_, i) => (
              <button 
                key={i} 
                onClick={(e) => { e.preventDefault(); setBannerIdx(i); }} 
                className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? "bg-white w-8" : "bg-white/40"}`} 
              />
            ))}
          </div>

          {/* Decorative elements */}
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -right-10 bottom-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
      </Link>

      {/* Product Sections */}
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <Section title="Best Sellers" icon={TrendingUp} products={bestSellers} href="/products?sort=best_sellers" />
        <Section title="New Arrivals" icon={Sparkles} products={newArrivals} href="/products?sort=newest" />
      </div>
    </div>
  );
}
