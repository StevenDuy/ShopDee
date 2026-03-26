"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Star, Package, Calendar, MessageCircle, ArrowLeft, Search } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useAuthStore } from "@/store/useAuthStore";
import FullPageLoader from "@/components/FullPageLoader";

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
    <div className="min-h-screen bg-muted/20">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {seller && (
          <>
            {/* Header / Cover */}
      <div className="bg-card border-b border-border pt-8 pb-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={16} /> Quay lại
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shrink-0 border border-primary/20 shadow-inner overflow-hidden">
               {seller.profile?.profile_image ? (
                 <img src={seller.profile.profile_image} className="w-full h-full object-cover" alt={seller.name} />
               ) : (
                 seller.name.charAt(0)
               )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight">{seller.name}</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                  {seller.profile?.bio || "Chào mừng bạn đến với cửa hàng của tôi! Chúc bạn mua sắm vui vẻ."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package size={18} className="text-primary" />
                  <span>{seller.products_count} sản phẩm</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  <span>{seller.avg_rating || "N/A"} Đánh giá</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar size={18} className="text-muted-foreground" />
                  <span>Tham gia {new Date(seller.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleChat}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all uppercase tracking-wider text-sm"
              >
                <MessageCircle size={20} /> Chat ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
             <Store size={24} className="text-primary" />
             Tất cả sản phẩm
          </h2>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Tìm trong cửa hàng này..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchProducts(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl outline-none focus:border-primary/50 transition-all text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-card border border-border rounded-[40px] py-20 text-center flex flex-col items-center gap-4">
             <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
               <Package size={40} />
             </div>
             <p className="text-muted-foreground font-bold">Không tìm thấy sản phẩm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/30 transition-all shadow-sm flex flex-col">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img src={p.media[0]?.full_url || `https://picsum.photos/seed/${p.id}/400/400`} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {p.sale_price && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">Sale</div>
                  )}
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold line-clamp-2 leading-snug flex-1 group-hover:text-primary transition-colors">{p.title}</h3>
                  <div>
                    <p className="text-primary font-black text-base">{formatPrice(p.sale_price ?? p.price)}</p>
                    {p.sale_price && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(p.price)}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
