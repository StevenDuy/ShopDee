"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items: {
    id: number;
    quantity: number;
    unit_price: number;
    product: {
      title: string;
      media: { url: string }[];
    };
  }[];
}

const API = "http://localhost:8000/api";
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipping:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    axios.get(`${API}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((r) => {
      setOrders(r.data.data ?? []);
    })
    .catch(err => console.error("Failed to fetch orders", err))
    .finally(() => setLoading(false));
  }, [token, router]);

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
        <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground bg-card border border-border rounded-2xl">
            <Package size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Bạn chưa có đơn hàng nào</p>
            <button 
                onClick={() => router.push("/products")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
            >
                Mua sắm ngay
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Package size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Đơn hàng #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                    {order.status === "shipping" ? (
                      <span className="flex items-center gap-1.5"><Truck size={14} /> Đang giao</span>
                    ) : order.status === "completed" ? (
                      <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Hoàn tất</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {order.status}</span>
                    )}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold opacity-50">Tổng thanh toán</p>
                    <p className="font-black text-xl text-primary">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-transparent hover:border-border transition-colors">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm">
                      <img 
                        src={item.product.media[0]?.url || `https://picsum.photos/seed/${item.id}/60/60`} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                        {item.product.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground font-medium">x{item.quantity}</p>
                        <p className="text-sm font-bold text-foreground/80">{formatPrice(item.unit_price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
