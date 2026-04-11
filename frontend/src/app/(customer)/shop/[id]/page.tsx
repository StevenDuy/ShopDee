"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Star, Package, Calendar, MessageCircle, ArrowLeft, Search, ShieldCheck } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SellerInfo {
  id: number;
  name: string;
  email: string;
  profile?: {
    bio?: string;
    phone?: string;
    profile_image?: string;
  };
  products_count: number;
  avg_rating: number;
  created_at: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  sale_price: number | null;
  media: { full_url: string }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function SellerShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { formatPrice } = useCurrencyStore();
  const { token } = useAuthStore();
  
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/shop/${id}`)
      .then(res => setSeller(res.data))
      .catch(() => router.push("/products"));

    fetchProducts();
  }, [id]);

  const fetchProducts = (query = "") => {
    axios.get(`${API}/shop/${id}/products?search=${query}`)
      .then(res => {
        setProducts(res.data.data);
        setLoading(false);
      });
  };

  const handleChat = () => {
    if (!token) {
      router.push(`/login?redirect=/shop/${id}`);
      return;
    }
    router.push(`/inbox?userId=${id}`);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {seller && (
          <>
            {/* Header / Cover — Fluid layout to fit with sidebar */}
            <div className="bg-card/40 backdrop-blur-3xl border-b border-border/10 lg:p-14 p-8 relative overflow-hidden">
                <div className="relative z-10">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all mb-10 active:scale-95 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t("back")}
                    </button>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col xl:flex-row gap-10 items-start xl:items-center"
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-5xl font-black shrink-0 border border-primary/20 shadow-2xl overflow-hidden relative group">
                            {seller.profile?.profile_image ? (
                                <img src={seller.profile.profile_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={seller.name} />
                            ) : (
                                seller.name.charAt(0)
                            )}
                            <div className="absolute top-3 right-3">
                                <ShieldCheck size={20} className="text-emerald-500 fill-emerald-500/20" />
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-foreground">{seller.name}</h1>
                                <p className="text-muted-foreground mt-3 max-w-3xl text-sm md:text-base leading-relaxed font-bold opacity-60">
                                    {seller.profile?.bio || t("shop.default_bio")}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-6 md:gap-10 border-t border-border/10 pt-6">
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary">
                                    <Package size={18} strokeWidth={2.5} />
                                    <span>{t("shop.products_count", { count: seller.products_count })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-yellow-500">
                                    <Star size={18} strokeWidth={2.5} className="fill-yellow-500/20" />
                                    <span>{t("shop.reviews_count", { count: seller.avg_rating || 0 })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                    <Calendar size={18} strokeWidth={2.5} />
                                    <span>{t("shop.joined_at", { year: new Date(seller.created_at).getFullYear() })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full xl:w-auto">
                            <Button 
                                onClick={handleChat}
                                className="flex-1 xl:flex-none h-16 px-12 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-[12px] border-b-4 border-primary-foreground/20"
                            >
                                <MessageCircle size={22} className="mr-3" /> {t("chat")}
                            </Button>
                        </div>
                    </motion.div>
                </div>
                {/* Decorative Pattern / Lighting */}
                <div className="absolute -bottom-20 -right-20 opacity-[0.05] pointer-events-none rotate-12 text-primary">
                   <Store size={500} />
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            </div>

            {/* Product List Section — Expansive Grid */}
            <div className="lg:p-14 p-8 space-y-12">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            <Package size={22} strokeWidth={3} />
                        </div>
                        {t("footer.all_products")}
                    </h2>
                    
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" size={18} />
                        <Input 
                            type="text" 
                            placeholder={t("shop.search_in_shop")} 
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                fetchProducts(val);
                            }}
                            className="h-14 pl-12 pr-4 bg-card border-border/50 rounded-2xl font-black text-[11px] tracking-widest outline-none transition-all shadow-sm focus-visible:ring-primary/10"
                        />
                    </div>
                </motion.div>

                {products.length === 0 ? (
                    <Card className="rounded-[3rem] border-dashed border-2 border-border/30 bg-muted/5 p-20 text-center grayscale opacity-40">
                        <Package size={64} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[12px] font-black uppercase tracking-widest leading-none">
                            {t("products_page.no_products")}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
                        {products.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                            >
                                <Link 
                                    href={`/products/${p.slug}`} 
                                    className="group block bg-card border border-border/40 rounded-3xl overflow-hidden hover:border-primary/50 hover:shadow-2xl transition-all duration-500 h-full flex flex-col relative"
                                >
                                    <div className="aspect-square overflow-hidden bg-muted relative">
                                        <img 
                                            src={p.media[0]?.full_url || `https://picsum.photos/seed/${p.id}/400/400`} 
                                            alt={p.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                        />
                                        {p.sale_price && (
                                            <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter shadow-xl">
                                                Sale
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                        <h3 className="text-[11px] font-black uppercase tracking-tight line-clamp-2 leading-none group-hover:text-primary transition-colors duration-300">
                                            {p.title}
                                        </h3>
                                        <div className="pt-2 border-t border-border/5">
                                            <p className="text-primary font-black text-base md:text-lg tracking-tighter leading-none">
                                                {formatPrice(p.sale_price ?? p.price)}
                                            </p>
                                            {p.sale_price && (
                                                <p className="text-[10px] text-muted-foreground line-through font-bold opacity-40">
                                                    {formatPrice(p.price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
          </>
        )}
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
