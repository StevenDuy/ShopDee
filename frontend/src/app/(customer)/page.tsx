"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";
import { Skeleton, ProductCardSkeleton, BannerSkeleton } from "@/components/Skeleton";
import { AnimatePresence, motion } from "framer-motion";
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

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrencyStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const img = product.media.find((m) => m.is_primary)?.full_url ?? product.media[0]?.full_url ?? "https://picsum.photos/300/300";

  return (
    <Link href={`/products/${product.slug}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-card border border-border rounded-2xl overflow-hidden group h-full flex flex-col transition-shadow"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imgLoaded && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
          />
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
          {useTranslation().t("view_all")} <ArrowRight size={16} />
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

export default function CustomerHomePage() {
  const { t } = useTranslation();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  // Helper to get full image URL
  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = API.replace("/api", "");
    return `${baseUrl}${path}`;
  };

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  useEffect(() => {
    axios.get(`${API}/banners?active_only=1`).then((r) => setBanners(r.data)).catch(() => { });
    axios.get(`${API}/products?sort=newest&limit=8&status=active`).then((r) => setNewArrivals(r.data.data ?? r.data ?? [])).catch(() => { });
    axios.get(`${API}/products?sort=best_sellers&limit=8&status=active`).then((r) => setBestSellers(r.data.data ?? r.data ?? [])).catch(() => { });
  }, []);

  const bannerColors = ["from-violet-600 to-indigo-600", "from-rose-600 to-pink-600", "from-emerald-600 to-teal-600"];
  const bannerEmojis = ["🛍️", "🎉", "🚀"];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {banners.length === 0 ? (
            <BannerSkeleton key="banner-loading" />
          ) : (
            <motion.div
              key="banner-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Link href={`/products/${banners[bannerIdx].product?.slug || ""}`} className="block">
                <div className="relative w-full aspect-[16/9] md:aspect-[21/7] bg-muted overflow-hidden cursor-pointer group shadow-xl transition-all">

                  {/* Main Banner Image */}
                  <img
                    src={getFullImageUrl(banners[bannerIdx].image_path)!}
                    alt={banners[bannerIdx].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12">
                    <motion.div
                      key={bannerIdx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-2xl"
                    >
                      <h1 className="text-2xl md:text-5xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                        {banners[bannerIdx].title}
                      </h1>
                      <p className="text-white/90 text-sm md:text-xl font-medium drop-shadow-md line-clamp-2">
                        {banners[bannerIdx].subtitle}
                      </p>
                    </motion.div>
                  </div>

                  {/* Dots */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 right-6 md:bottom-8 md:right-12 flex gap-2 z-20">
                      {banners.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.preventDefault(); setBannerIdx(i); }}
                          className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${i === bannerIdx ? "bg-white w-6 md:w-8" : "bg-white/40 hover:bg-white/60"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Sections */}
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <Section title={t("customer_home.best_sellers")} icon={TrendingUp} products={bestSellers} href="/products?sort=best_sellers" />
        <Section title={t("customer_home.new_arrivals")} icon={Sparkles} products={newArrivals} href="/products?sort=newest" />
      </div>
    </div>
  );
}
