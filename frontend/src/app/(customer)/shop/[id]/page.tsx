"use client";

import { useEffect, useState } from "react";
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

export default function SellerShopPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
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
            {/* Header / Cover (Restored Old Layout) */}
            <div className="bg-card border-b border-border/50 pt-8 pb-12 px-6 md:px-10 shadow-sm relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all mb-8 active:scale-95 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t?.("common.back") || "Quay lại"}
                    </button>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col md:flex-row gap-8 items-start md:items-center"
                    >
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shrink-0 border border-primary/20 shadow-inner overflow-hidden relative group">
                            {seller.profile?.profile_image ? (
                                <img src={seller.profile.profile_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={seller.name} />
                            ) : (
                                seller.name.charAt(0)
                            )}
                            <div className="absolute top-1 right-1">
                                <ShieldCheck size={16} className="text-emerald-500 fill-emerald-500/20" />
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-5">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">{seller.name}</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed font-bold opacity-70">
                                    {seller.profile?.bio || "Chào mừng bạn đến với cửa hàng của tôi! Chúc bạn mua sắm vui vẻ."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 md:gap-8 border-t border-border/5 pt-4">
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Package size={16} strokeWidth={2.5} className="text-primary" />
                                    <span>{seller.products_count} sản phẩm</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Star size={16} strokeWidth={2.5} className="text-yellow-500 fill-yellow-500/20" />
                                    <span>{seller.avg_rating || "N/A"} Đánh giá</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                    <Calendar size={16} strokeWidth={2.5} />
                                    <span>Tham gia {new Date(seller.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <Button 
                                onClick={handleChat}
                                className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all text-[11px]"
                            >
                                <MessageCircle size={20} className="mr-3" /> Chat ngay
                            </Button>
                        </div>
                    </motion.div>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
                   <Store size={400} />
                </div>
            </div>

            {/* Product List Section (Restored Old Layout) */}
            <div className="px-6 md:px-10 py-12 max-w-7xl mx-auto space-y-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap"
                >
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                            <Package size={18} strokeWidth={2.5} />
                        </div>
                        Tất cả sản phẩm
                    </h2>
                    
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" size={18} />
                        <Input 
                            type="text" 
                            placeholder="TÌM TRONG CỬA HÀNG..." 
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
                            Không có sản phẩm nào
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
