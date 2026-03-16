"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Package, Truck, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { toast } from "sonner";
import ReviewModal from "@/components/customer/ReviewModal";
import { Star } from "lucide-react";
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
      media: { url: string }[];
    };
    selected_options?: Record<string, string> | null;
    review?: {
        id: number;
        rating: number;
        comment: string;
    } | null;
  }[];
}

const API = "http://localhost:8000/api";

const STATUS_MAP: Record<string, { label: string, color: string, icon: any }> = {
  pending:    { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  processing: { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Package },
  shipped:    { label: "Đang giao", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck },
  delivered:  { label: "Đã giao", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: CheckCircle },
  completed:  { label: "Hoàn tất", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled:  { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  returned:   { label: "Trả hàng", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
};

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  
  // Review Modal State
  const [reviewItem, setReviewItem] = useState<Order['items'][0] | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const r = await axios.get(`${API}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(r.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchOrders();
  }, [token, router]);

  const handleCancelOrder = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await axios.put(`${API}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: (token as string).startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      toast.success("Đã hủy đơn hàng thành công");
      setConfirmId(null);
      fetchOrders();
    } catch (err: any) {
      console.error("Cancel order error:", err);
      toast.error(err.response?.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReceived = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await axios.put(`${API}/orders/${orderId}/receive`, {}, {
        headers: { Authorization: (token as string).startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      toast.success(t("customer_orders.success_confirm_received"));
      setConfirmId(null);
      fetchOrders();
    } catch (err: any) {
      console.error("Confirm received error:", err);
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Package size={24} />
        </div>
        <h1 className="text-2xl font-bold">{t("my_orders")}</h1>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground bg-card border border-border rounded-2xl shadow-sm">
            <Package size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">{t("customer_orders.no_orders_yet")}</p>
            <button 
                onClick={() => router.push("/products")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
            >
                {t("customer_orders.shop_now")}
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-muted text-muted-foreground", icon: Clock };
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id} 
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-5 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-muted rounded-xl">
                      <Package size={22} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{t("seller.orders.order_id")} #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("seller.orders.date")}: {new Date(order.created_at).toLocaleDateString(t("locale"))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider ${statusInfo.color}`}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </span>
                    <div className="hidden md:block w-px h-8 bg-border" />
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-black opacity-50 tracking-tighter">{t("customer_orders.total_payment")}</p>
                      <p className="font-black text-xl text-primary leading-tight">{formatPrice(order.total_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 bg-muted/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3 hover:border-primary/20 transition-colors">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm">
                          <img 
                            src={item.product.media[0]?.url ? `http://localhost:8000${item.product.media[0].url}` : `https://picsum.photos/seed/${item.id}/80/80`} 
                            alt={item.product.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold line-clamp-1">
                            {item.product.title}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">x{item.quantity}</p>
                            <p className="text-sm font-bold text-foreground/80">{formatPrice(item.unit_price)}</p>
                          </div>
                          {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.entries(item.selected_options).map(([k, v]) => (
                                    <span key={k} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 uppercase font-bold">
                                        {k}: {v}
                                    </span>
                                ))}
                            </div>
                          )}
                        </div>

                        {order.status === 'completed' && (
                          <div className="shrink-0 flex items-center gap-2">
                             {item.review ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-0.5 mb-1">
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={10} className={s <= item.review!.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase">{t("customer_orders.reviewed")}</span>
                                </div>
                             ) : (
                                <button 
                                    onClick={() => {
                                        setReviewItem(item);
                                        setIsReviewModalOpen(true);
                                    }}
                                    className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all group"
                                    title={t("customer_orders.review_product")}
                                >
                                    <Star size={18} className="group-hover:fill-current" />
                                </button>
                             )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 px-5 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground italic">
                    {order.status === 'pending' && t("customer_orders.status_msg.pending")}
                    {order.status === 'processing' && t("customer_orders.status_msg.processing")}
                    {order.status === 'shipped' && t("customer_orders.status_msg.shipped")}
                    {order.status === 'delivered' && t("customer_orders.status_msg.delivered")}
                    {order.status === 'completed' && t("customer_orders.status_msg.completed")}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        {confirmId === order.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={processingId === order.id}
                              className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                              {processingId === order.id ? "..." : t("customer_orders.confirm_cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="px-4 py-2 text-sm font-bold bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all"
                            >
                              {t("customer_orders.back")}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(order.id)}
                            className="flex-1 sm:flex-none px-5 py-2 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-all"
                          >
                            {t("customer_orders.cancel_order")}
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        {confirmId === order.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmReceived(order.id)}
                              disabled={processingId === order.id}
                              className="px-4 py-2 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                            >
                              {processingId === order.id ? "..." : t("customer_orders.confirm_received")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="px-4 py-2 text-sm font-bold bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all"
                            >
                              {t("customer_orders.back")}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(order.id)}
                            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold bg-primary text-white hover:opacity-90 rounded-xl shadow-sm shadow-primary/20 transition-all"
                          >
                            {t("customer_orders.received_order")}
                          </button>
                        )}
                      </div>
                    )}

                    <button 
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="flex-1 sm:flex-none px-5 py-2 text-sm font-bold bg-white dark:bg-zinc-800 border border-border hover:bg-muted rounded-xl transition-all"
                    >
                      {t("customer_orders.details")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => {
            setIsReviewModalOpen(false);
            setReviewItem(null);
        }}
        orderItem={reviewItem}
        onSuccess={fetchOrders}
      />
    </div>
  );
}
