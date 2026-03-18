"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, TrendingUp, Sparkles } from "lucide-react";
import FullPageLoader from "@/components/FullPageLoader";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";

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
  const { formatPrice } = useCurrencyStore();
  const img = product.media.find((m) => m.is_primary)?.full_url ?? product.media[0]?.full_url ?? "https://picsum.photos/300/300";

  return (
    <Link href={`/products/${product.slug}`} className="block h-full group">
      <div className="bg-card border border-border h-full flex flex-col group-hover:border-primary">
        <div className="relative aspect-square overflow-hidden bg-muted border-b border-border">
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {product.sale_price && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 border border-white">
              -{Math.round((1 - product.sale_price / product.price) * 100)}%
            </span>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          {product.category && <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{product.category.name}</p>}
          <h3 className="font-bold text-xs line-clamp-2 mb-2 leading-tight uppercase">{product.title}</h3>

          <div className="mt-auto flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">{formatPrice(product.sale_price ?? product.price)}</span>
              {product.sale_price && (
                <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} className={s <= 4 ? "fill-primary text-primary" : "fill-muted text-muted"} />
              ))}
              <span className="text-[10px] font-mono ml-1">4.0</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, icon: Icon, products, href }: { title: string; icon: React.ElementType; products: Product[]; href: string }) {
  const { t } = useTranslation();
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary" />
          <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-bold uppercase flex items-center gap-1 hover:underline">
          {t("view_all")} <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
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
          axios.get(`${API}/products?sort=newest&limit=10&status=active`),
          axios.get(`${API}/products?sort=best_sellers&limit=10&status=active`)
        ]);

        setBanners(bannersRes.data);
        setNewArrivals(newArrivalsRes.data.data ?? newArrivalsRes.data ?? []);
        setBestSellers(bestSellersRes.data.data ?? bestSellersRes.data ?? []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex items-center justify-center font-black text-sm uppercase tracking-[0.2em]">
          {t("home")}
        </div>
        <div className="w-14 shrink-0" />
      </div>

      {/* 2D Hero Banner */}
      {banners.length > 0 && (
        <div className="w-full border-b-4 border-primary">
          <Link href={`/products/${banners[bannerIdx].product?.slug || ""}`} className="block relative aspect-[21/9] md:aspect-[21/6]">
            <img
              src={getFullImageUrl(banners[bannerIdx].image_path)!}
              alt={banners[bannerIdx].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-10">
              <div className="border-l-8 border-primary pl-6 bg-white/10 backdrop-blur-sm self-start py-4 pr-12">
                <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">
                  {banners[bannerIdx].title}
                </h1>
                <p className="text-white font-bold text-sm md:text-lg">
                  {banners[bannerIdx].subtitle}
                </p>
              </div>
            </div>
            
            {/* Banner Control */}
            <div className="absolute bottom-4 right-6 flex gap-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setBannerIdx(i); }}
                  className={`w-8 h-2 border border-white ${i === bannerIdx ? "bg-primary" : "bg-white/20"}`}
                />
              ))}
            </div>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="container-2d py-10">
        <Section title={t("customer_home.best_sellers")} icon={TrendingUp} products={bestSellers} href="/products?sort=best_sellers" />
        <Section title={t("customer_home.new_arrivals")} icon={Sparkles} products={newArrivals} href="/products?sort=newest" />
      </div>
    </div>
  );
}
