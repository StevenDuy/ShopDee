"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Star, ArrowLeft, Search, MessageSquare, Package, Filter, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { name: string };
  product?: { title: string; media?: { full_url: string }[] };
  order_item?: { product: { title: string }; selected_options?: Record<string, string> | null; };
  resolved_media?: string[];
  media?: string[] | any;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={10} className={s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
      ))}
    </div>
  );
}

function ReviewsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const productId = searchParams.get("productId");
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [viewingReviewImage, setViewingReviewImage] = useState<string | null>(null);

  const getFullMediaUrl = (url: any) => {
    if (!url) return "";
    if (typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    const baseUrl = API.split("/api")[0];
    if (cleanPath.startsWith("storage/")) return `${baseUrl}/${cleanPath}`;
    return `${baseUrl}/storage/${cleanPath}`;
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    const url = productId 
      ? `${API}/seller/reviews?product_id=${productId}`
      : `${API}/seller/reviews`;

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setReviews(res.data.data?.data || res.data.data || []);
        setAvgRating(res.data.avg_rating || 0);
        if (productId && res.data.product) {
          setProductInfo(res.data.product);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [productId, token]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
        <div className="text-center md:text-left">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 hover:opacity-70 transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} /> {t("back")}
          </button>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
            {t("product_details.reviews")}
          </h1>
          <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
             {productId ? `${t("seller.products_manage.product")}: ${productInfo?.title || "Loading..."}` : "ALL CUSTOMER FEEDBACK"}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-primary text-white px-8 py-4 rounded-[2rem] shadow-xl shadow-primary/20">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black tabular-nums">{avgRating.toFixed(1)}</span>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{t("product_details.rating_avg")}</span>
          </div>
          <div className="w-px h-10 bg-white/20 ml-2" />
          <div className="flex flex-col items-center gap-1.5 ml-2">
            <StarRow rating={avgRating} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{reviews.length} {t("product_details.reviews")}</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-32 flex flex-col items-center gap-4 opacity-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">{t("inbox.loading")}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/10">
            <div className="flex flex-col items-center opacity-30">
              <MessageSquare size={40} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">{t("product_details.no_reviews")}</p>
            </div>
          </div>
        ) : (
          reviews.map((r, idx) => (
            <motion.div 
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-8 rounded-[3rem] border border-border/5 bg-card/40 backdrop-blur-md relative group hover:bg-card/60 transition-all duration-500 shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-xs text-primary border border-primary/20">
                    {r.customer.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-xs uppercase tracking-wider text-foreground/80">{r.customer.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                          <Calendar size={10} /> {new Date(r.created_at).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </div>
                <StarRow rating={r.rating} />
              </div>
              
              {!productId && r.product && (
                <div className="mb-4 p-3 bg-muted/20 rounded-2xl border border-border/10 flex items-center gap-3">
                   <div className="w-10 h-10 bg-background rounded-lg overflow-hidden border border-border/40 shrink-0">
                      <img src={r.product.media?.[0]?.full_url || ""} className="w-full h-full object-cover" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1 opacity-60 italic">{r.product.title}</p>
                </div>
              )}

              {r.comment && (
                <div className="text-sm font-bold leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2 text-foreground/70 mb-4">
                  {r.comment}
                </div>
              )}

              {(() => {
                let mediaList: string[] = [];
                if (Array.isArray(r.resolved_media) && r.resolved_media.length > 0) {
                  mediaList = r.resolved_media;
                } else if (Array.isArray(r.media) && r.media.length > 0) {
                  mediaList = r.media;
                } else if (typeof r.media === 'string' && r.media.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(r.media);
                    if (Array.isArray(parsed)) mediaList = parsed;
                  } catch (e) {}
                }

                if (mediaList.length === 0) return null;

                return (
                  <div className="flex flex-wrap gap-2">
                     {mediaList.map((url: string, midx: number) => {
                       const fullUrl = getFullMediaUrl(url);
                       return (
                         <div 
                           key={midx} 
                           className="relative group w-16 h-16 rounded-xl overflow-hidden border border-border/10 cursor-pointer shadow-sm bg-muted/40 flex items-center justify-center"
                           onClick={() => setViewingReviewImage(fullUrl)}
                         >
                            <img 
                              src={fullUrl} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Search className="text-white" size={14} strokeWidth={3} />
                            </div>
                         </div>
                       );
                     })}
                  </div>
                );
              })()}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {viewingReviewImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-background/95 backdrop-blur-2xl" 
            onClick={() => setViewingReviewImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative max-w-5xl w-full" 
              onClick={e => e.stopPropagation()}
            >
              <img src={viewingReviewImage} alt="Fullscreen" className="w-full h-auto max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border border-border/20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellerReviewsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse tracking-widest font-black uppercase text-[10px] opacity-20">LOADING ECOSYSTEM...</div>}>
      <ReviewsContent />
    </Suspense>
  );
}
