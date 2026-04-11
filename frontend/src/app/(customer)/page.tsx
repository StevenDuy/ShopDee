"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, TrendingUp, Sparkles, ArrowRight, Zap, Sidebar } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrencyStore();
  const img = product.media.find((m) => m.is_primary)?.full_url ?? product.media[0]?.full_url ?? "https://picsum.photos/300/300";
 
  return (
    <Link href={`/products/${product.slug}`} className="block group h-full">
      <div className="h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.sale_price && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg rotate-[-5deg]">
              -{Math.round((1 - product.sale_price / product.price) * 100)}%
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-5 flex-1 flex flex-col gap-2">
          {product.category && (
            <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.2em]">
              {product.category.name}
            </p>
          )}
          <h3 className="font-bold text-sm line-clamp-2 leading-tight uppercase transition-colors group-hover:text-primary">
            {product.title}
          </h3>
 
          <div className="mt-auto pt-2 space-y-3">
            <div className="flex items-baseline gap-2 pt-2">
              <span className="font-black text-base text-primary tracking-tighter">
                {formatPrice(product.sale_price ?? product.price)}
              </span>
              {product.sale_price && (
                <span className="text-[10px] text-muted-foreground line-through font-medium opacity-40">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
 
function Section({ title, products, href }: { title: string; products: Product[]; href: string }) {
  const { t } = useTranslation();
  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{title}</h2>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>
        <Link href={href} className="group flex items-center gap-2 px-5 py-2.5 bg-muted/50 hover:bg-primary hover:text-white rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300">
          {t("view_all")} 
          <ArrowRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {products.slice(0, 12).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export default function CustomerHomePage() {
  const { t } = useTranslation();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = API.replace("/api", "");
    return `${baseUrl}${path}`;
  };

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, newArrivalsRes, bestSellersRes] = await Promise.all([
          axios.get(`${API}/banners?active_only=1`),
          axios.get(`${API}/products?sort=newest&limit=12&status=active`),
          axios.get(`${API}/products?sort=best_sellers&limit=12&status=active`)
        ]);

        setBanners(bannersRes.data);
        setNewArrivals(newArrivalsRes.data.data ?? newArrivalsRes.data ?? []);
        setBestSellers(bestSellersRes.data.data ?? bestSellersRes.data ?? []);
      } catch (error) {
        console.error(t("customer_home.error_loading"), error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-screen-2xl mx-auto p-6 md:p-10 pb-24 md:pb-10 space-y-12 animate-in fade-in duration-700">
      {/* Premium Swippable Hero Banner (Sharp Edges) */}
      {banners.length > 0 && (
        <div className="relative w-full overflow-hidden shadow-2xl group/banner rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: "easeInOut", duration: 0.4 }}
              className="block relative aspect-[21/9] md:aspect-[21/6] overflow-hidden"
            >
              <Link href={`/products/${banners[bannerIdx].product?.slug || ""}`}>
                <img
                  src={getFullImageUrl(banners[bannerIdx].image_path)!}
                  alt={banners[bannerIdx].title}
                  className="w-full h-full object-cover"
                />
                {/* Minimalist Overlay (No Background) */}
                <div className="absolute inset-x-8 bottom-8 md:inset-x-12 md:bottom-12 flex flex-col items-start gap-4 pointer-events-none drop-shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                    <Sparkles size={10} /> {t("customer_home.new_arrivals")}
                  </div>
                  <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none [text-shadow:_0_4px_8px_rgb(0_0_0_/_40%)]">
                    {banners[bannerIdx].title}
                  </h1>
                  <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-wide max-w-sm [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)]">
                    {banners[bannerIdx].subtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
            
          {/* Banner Control - Premium Dots */}
          <div className="absolute bottom-12 right-12 flex gap-3 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setBannerIdx(i); }}
                className={`h-2 transition-all duration-500 rounded-full ${i === bannerIdx ? "w-12 bg-primary shadow-lg shadow-primary/40" : "w-3 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      )}
 
      {/* Main Content Sections */}
      <div className="space-y-16 py-4">
        <Section title={t("customer_home.best_sellers")} products={bestSellers} href="/products?sort=best_sellers" />
        
        {/* Mid-Page Promo / Divider */}
        <div className="py-12 border-y-4 border-primary/10 flex flex-col items-center text-center space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{t("customer_home.limited_collection")}</div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">{t("customer_home.experience_elite")}</h2>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">{t("customer_home.premium_quality_delivery")}</p>
        </div>
 
        <Section title={t("customer_home.new_arrivals")} products={newArrivals} href="/products?sort=newest" />
      </div>
    </div>
  );
}





