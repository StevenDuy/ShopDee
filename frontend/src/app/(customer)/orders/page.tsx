"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { 
  Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, 
  ArrowRight, ExternalLink, ReceiptText, ChevronRight 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { toast } from "sonner";
import ReviewModal from "@/components/customer/ReviewModal";
import { useTranslation } from "react-i18next";

interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    product: {
      title: string;
      status: string;
      media: { url: string; full_url: string }[];
    };
    selected_options?: Record<string, string> | null;
    review?: {
      id: number;
      rating: number;
      comment: string;
    } | null;
  }[];
}

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [reviewItem, setReviewItem] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const STATUS_MAP: Record<string, { label: string, color: string, glow: string, icon: any }> = {
    pending: { label: t("customer_orders.status_pending"), color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20", glow: "shadow-yellow-500/20", icon: Clock },
    processing: { label: t("customer_orders.status_processing"), color: "text-blue-600 bg-blue-500/10 border-blue-500/20", glow: "shadow-blue-500/20", icon: Package },
    shipped: { label: t("customer_orders.status_shipped"), color: "text-purple-600 bg-purple-500/10 border-purple-500/20", glow: "shadow-purple-500/20", icon: Truck },
    delivered: { label: t("customer_orders.status_delivered"), color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20", glow: "shadow-indigo-500/20", icon: CheckCircle },
    completed: { label: t("customer_orders.status_completed"), color: "text-green-600 bg-green-500/10 border-green-500/20", glow: "shadow-green-500/20", icon: CheckCircle },
    cancelled: { label: t("customer_orders.status_cancelled"), color: "text-red-600 bg-red-500/10 border-red-500/20", glow: "shadow-red-500/20", icon: XCircle },
    returned: { label: t("customer_orders.status_returned"), color: "text-orange-600 bg-orange-500/10 border-orange-500/20", glow: "shadow-orange-500/20", icon: AlertCircle },
  };

  const fetchOrders = async () => {
    try {
      const r = await axios.get(`${API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(r.data.data ?? []);
    } catch (err) {
      toast.error(t("customer_orders.error_load_orders"));
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    if (paymentStatus === "success") {
      toast.success(t("checkout_page.order_success"), { duration: 5000 });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === "failed") {
      toast.error(t("customer_orders.payment_failed"), { description: t("customer_orders.payment_failed_desc") });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paymentStatus, t]);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    fetchOrders();
  }, [token, router]);

  const handleCancelOrder = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: (token as string).startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      toast.success(t("customer_orders.success_cancel"));
      setConfirmId(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("customer_orders.error_cancel"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReceived = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/receive`, {}, {
        headers: { Authorization: (token as string).startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      toast.success(t("customer_orders.success_confirm_received"));
      setConfirmId(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error_occurred"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-700 pb-20 overflow-x-hidden">
      
      {/* Precision Header */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/10 mb-8 sticky top-0 z-[100]">
        <div className="px-8 md:px-14 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                 <ReceiptText size={20} strokeWidth={3} />
              </div>
              <h1 className="text-[14px] font-black uppercase tracking-[0.4em] text-foreground">{t("my_orders")}</h1>
           </div>
        </div>
      </div>

      <div className="px-8 md:px-14">
        <AnimatePresence mode="wait">
          {orders.length === 0 && !loading ? (
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden"
            >
               <h2 className="text-xl font-black uppercase tracking-tighter mb-2">{t("customer_orders.no_orders_yet")}</h2>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-40 mb-8 italic">{t("customer_orders.empty_record_hint")}</p>
               <button onClick={() => router.push("/products")} className="px-10 py-3 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {t("customer_orders.start_trading")}
               </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "text-muted-foreground bg-muted border-border", glow: "", icon: Clock };
                const StatusIcon = statusInfo.icon;
                const hasBanned = order.items.some(i => i.product?.status === 'banned') && order.status !== 'cancelled';
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    key={order.id}
                    className={`bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border ${hasBanned ? 'border-red-500/40' : 'border-white/20 dark:border-slate-800/10'} rounded-2xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden`}
                  >
                    {/* Golden Ratio Horizontal Precision Layout */}
                    <div className="flex items-center gap-6 p-4 md:p-5">
                      
                      {/* Fixed Col 1: Administrative Identity (~140px) */}
                      <div className="w-[140px] shrink-0 border-r border-border/10 pr-6">
                        <span className="text-[7.5px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] block mb-1">{t("customer_orders.record_id")}</span>
                        <p className="text-[11px] font-black uppercase tracking-tight text-primary">#{order.id}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 leading-none">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>

                      {/* Fixed Col 2: Status Chip (~130px) */}
                      <div className="w-[130px] shrink-0 border-r border-border/10 pr-6">
                         <span className="text-[7.5px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] block mb-1">{t("seller.orders.status").toUpperCase()}</span>
                         <span className={`text-[8px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap ${statusInfo.color} ${statusInfo.glow}`}>
                            <StatusIcon size={10} strokeWidth={3} /> {statusInfo.label}
                         </span>
                      </div>

                      {/* Flexible Col 3: Visual Content Detail */}
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                         <div className="flex -space-x-4">
                            {order.items.slice(0, 3).map((item, idx) => (
                               <div key={`${order.id}-img-${item.id}`} className="w-9 h-9 rounded-xl border-2 border-white/20 bg-white shadow-xl flex-shrink-0" style={{ zIndex: 10 - idx }}>
                                  <OrderImageItem src={item.product?.media?.[0]?.full_url} alt={item.product?.title} />
                               </div>
                            ))}
                         </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[7.5px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] block mb-1">{t("seller.products").toUpperCase()}</span>
                            <p className="text-[10px] font-black uppercase tracking-tight truncate opacity-80">{order.items[0].product.title}</p>
                            {order.items.length > 1 && (
                               <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest leading-none mt-0.5">{t("customer_orders.more_items", { count: order.items.length - 1 })}</p>
                            )}
                          </div>
                      </div>

                      {/* Fixed Col 4: Financial Summary (~120px) */}
                      <div className="w-[120px] shrink-0 border-l border-border/10 pl-6 flex flex-col items-end">
                         <span className="text-[7.5px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] block mb-1 leading-none">{t("customer_orders.total_value")}</span>
                         <p className="text-[16px] font-black text-primary tracking-tighter leading-none">{formatPrice(order.total_amount)}</p>
                         <p className="text-[7px] font-black uppercase text-muted-foreground/40 mt-1">{order.payment_method.toUpperCase()}</p>
                      </div>

                      {/* Fixed Col 5: Global Actions (~200px) */}
                      <div className="w-[200px] shrink-0 border-l border-border/10 pl-6 flex items-center justify-end gap-2">
                        {(order.status === 'pending' || order.status === 'processing') && (
                           confirmId === order.id ? (
                              <div className="flex gap-1 animate-in zoom-in whitespace-nowrap">
                                 <button onClick={() => handleCancelOrder(order.id)} disabled={processingId === order.id} className="px-3 py-1.5 text-[8px] font-black uppercase bg-red-600 text-white rounded-lg">OK</button>
                                 <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-[8px] font-black uppercase bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border border-border/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">X</button>
                              </div>
                           ) : (
                              <button onClick={() => setConfirmId(order.id)} className="px-4 py-2 text-[8px] font-black uppercase text-red-600 border border-red-500/10 hover:bg-red-500/5 rounded-xl transition-all whitespace-nowrap">
                                 {t("customer_orders.cancel_order")}
                              </button>
                           )
                        )}

                        {order.status === 'delivered' && (
                           confirmId === order.id ? (
                              <div className="flex gap-1 whitespace-nowrap">
                                 <button onClick={() => handleConfirmReceived(order.id)} className="px-4 py-1.5 text-[8px] font-black uppercase bg-green-600 text-white rounded-lg">{t("customer_orders.ack")}</button>
                                 <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-[8px] font-black uppercase bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border border-border/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">X</button>
                              </div>
                           ) : (
                              <button onClick={() => setConfirmId(order.id)} className="px-5 py-2 text-[8px] font-black uppercase bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all whitespace-nowrap">
                                 {t("customer_orders.confirm_received_btn")}
                              </button>
                           )
                        )}

                        {order.status === 'completed' && (() => {
                           const allReviewed = order.items.every(i => i.review);
                           return allReviewed ? (
                              <button 
                                className="px-5 py-2 text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl cursor-default flex items-center gap-2 whitespace-nowrap shadow-sm"
                              >
                                 <CheckCircle size={10} strokeWidth={3} className="text-emerald-500" />
                                 {t("customer_orders.reviewed")}
                              </button>
                           ) : (
                              <button 
                                onClick={() => {
                                  const itemToReview = order.items.find(i => !i.review) || order.items[0];
                                  setReviewItem(itemToReview);
                                  setIsReviewModalOpen(true);
                                }} 
                                className="px-5 py-2 text-[8px] font-black uppercase bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all whitespace-nowrap"
                              >
                                 {t("reviews.title") || "Review Now"}
                              </button>
                           );
                        })()}

                        <div className="px-4 py-2 text-[8px] font-black uppercase bg-white/5 border border-border/10 text-muted-foreground/40 rounded-xl flex items-center gap-2 whitespace-nowrap">
                           {t("customer_orders.details")}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewItem(null); }}
        orderItem={reviewItem}
        onSuccess={fetchOrders}
      />
    </div>
  );
}

function OrderImageItem({ src, alt }: { src: string | null | undefined, alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const getFullImageUrl = (path: string | null | undefined) => {
    if (!path) return `https://picsum.photos/seed/${alt}/50/50`;
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
    const baseUrl = API_URL.replace("/api", "");
    return `${baseUrl}${path}`;
  };
  const fullSrc = getFullImageUrl(src);
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <img
        src={fullSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
      />
      {!loaded && <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg" />}
    </div>
  );
}
