"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Search, Eye, Filter, CheckCircle, Package, Truck, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { OrderDetailsModal } from "@/components/seller/OrderDetailsModal";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: number;
  product: {
    title: string;
    media: { url: string }[];
  };
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
};

export default function SellerOrdersPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewingOrder, setViewingOrder] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = (status = "all", page = 1) => {
    if (!token) return;
    setLoading(true);
    axios.get(`${API}/seller/orders?page=${page}${status !== 'all' ? `&status=${status}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setOrders(res.data.data || []);
        setTotalPages(res.data.last_page || 1);
        setCurrentPage(res.data.current_page || 1);
      })
      .catch(err => console.error("Error fetching orders", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(filter, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, currentPage]);

  const updateOrderStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await axios.put(`${API}/seller/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(filter, currentPage);
    } catch (err) {
      console.error("Failed to update status", err);
      alert(t("seller.settings.update_error") || "Status update failed.");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600",
      processing: "bg-blue-500/10 text-blue-600",
      shipped: "bg-indigo-500/10 text-indigo-600",
      delivered: "bg-emerald-500/10 text-emerald-600",
      completed: "bg-green-500/10 text-green-600",
      cancelled: "bg-destructive/10 text-destructive",
      returned: "bg-gray-500/10 text-gray-600",
    };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>{t(`seller.orders.status_${status}`)}</span>;
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {loading && <FullPageLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("seller.orders.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("seller.orders.desc")}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder={t("seller.orders.search_placeholder")}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={18} className="text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="bg-input border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-auto"
              >
                <option value="all">{t("seller.orders.all_orders")}</option>
                <option value="pending">{t("seller.orders.status_pending")}</option>
                <option value="processing">{t("seller.orders.status_processing")}</option>
                <option value="shipped">{t("seller.orders.status_shipped")}</option>
                <option value="delivered">{t("seller.orders.status_delivered")}</option>
                <option value="return_requested">{t("seller.orders.status_return_requested")}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">{t("seller.orders.order_id")}</th>
                  <th className="px-6 py-4 font-medium">{t("seller.orders.date")}</th>
                  <th className="px-6 py-4 font-medium">{t("seller.orders.customer")}</th>
                  <th className="px-6 py-4 font-medium">{t("seller.orders.total")}</th>
                  <th className="px-6 py-4 font-medium text-right">{t("seller.orders.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                      {t("seller.orders.loading_orders")}
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <Package size={48} className="opacity-20 mb-3" />
                        <p>{t("seller.orders.no_orders_found")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const customerName = order.customer.name || order.customer.email;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setViewingOrder(order.id)}
                        className="hover:bg-muted/50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                      >
                        <td className="px-6 py-4 font-medium">
                          <span className="group-hover:text-primary transition-colors">#{order.id.toString().padStart(6, '0')}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), {
                            addSuffix: true,
                            locale: t("locale") === "vi-VN" ? vi : enUS
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground">{customerName}</span>
                          <span className="block text-xs text-muted-foreground">{order.items.length} {t("seller.orders.items")}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-primary">
                          {new Intl.NumberFormat(t("locale"), { style: "currency", currency: t("currency_code") }).format(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted hover:bg-muted/80"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {viewingOrder && (
          <OrderDetailsModal
            orderId={viewingOrder}
            onClose={() => setViewingOrder(null)}
            onStatusChange={updateOrderStatus}
          />
        )}
      </motion.div>
    </div>
  );
}
