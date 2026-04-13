"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Search, Filter, ShoppingBag, Clock, 
  Package, Box, BarChart3, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { OrderDetailsModal } from "@/components/seller/OrderDetailsModal";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

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
  const [search, setSearch] = useState("");

  const fetchOrders = (status = "all", page = 1, query = "") => {
    if (!token) return;
    setLoading(true);
    axios.get(`${API}/seller/orders?page=${page}${status !== 'all' ? `&status=${status}` : ''}${query ? `&search=${query}` : ''}`, {
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
    fetchOrders(filter, currentPage, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, currentPage]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    fetchOrders(filter, 1, val);
  };

  const updateOrderStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await axios.put(`${API}/seller/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(filter, currentPage, search);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const { formatPrice } = useCurrencyStore();

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Box size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    {t("seller.orders.order_management")}
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                {t("seller.orders.title")}
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                {t("seller.orders.desc")}
              </p>
           </div>
        </div>

        {/* 2. LIVE SEARCH & QUICK STATS (Matching Products Layout with Premium Select) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
           <div className="lg:col-span-4 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.orders.order_search")}</label>
              <div className="relative group">
                 <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={20} />
                 <Input
                   type="text"
                   placeholder={t("seller.orders.search_placeholder")}
                   value={search}
                   onChange={(e) => handleSearch(e.target.value)}
                   className="h-14 pl-16 pr-6 bg-card border-border/50 rounded-[1.5rem] font-bold text-sm shadow-sm focus-visible:bg-background focus-visible:ring-primary/10 transition-all placeholder:opacity-30 relative z-10"
                 />
              </div>
           </div>

           <div className="lg:col-span-8 flex flex-wrap lg:justify-end gap-4 pb-1">
              <QuickStat icon={ShoppingBag} label={t("seller.orders.total_orders")} value={orders.length.toString()} />
              <QuickStat icon={Clock} label={t("seller.orders.pending_action")} value={orders.filter(o => o.status === 'pending').length.toString()} />
              
              <div className="relative group h-14 min-w-[200px]">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60 z-20" size={18} strokeWidth={2.5} />
                <Select 
                   value={filter} 
                   onValueChange={(val: any) => { setFilter(val); setCurrentPage(1); }}
                >
                   <SelectTrigger className="w-full h-full pl-14 pr-10 bg-muted/20 border border-border/50 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] appearance-none focus:ring-0 focus:border-primary/50 transition-all cursor-pointer relative z-10 shadow-sm focus:bg-background">
                      <SelectValue placeholder={t("seller.orders.filter_status")}>
                         {filter === "all" ? t("seller.orders.all_orders") : undefined}
                      </SelectValue>
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl bg-card/80">
                      <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.all_orders")}</SelectItem>
                      <SelectItem value="pending" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.status_pending")}</SelectItem>
                      <SelectItem value="processing" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.status_processing")}</SelectItem>
                      <SelectItem value="shipped" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.status_shipped")}</SelectItem>
                      <SelectItem value="delivered" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.status_delivered")}</SelectItem>
                      <SelectItem value="return_requested" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.orders.status_return_requested")}</SelectItem>
                   </SelectContent>
                </Select>
              </div>
           </div>
        </div>

        {/* 3. ORDER TABLE CONTAINER (Matching Products rounded-[3rem]) */}
        <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                 <thead className="bg-muted/30 border-b border-border/30 text-muted-foreground">
                    <tr>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.orders.order_id").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.orders.date").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.orders.customer").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.orders.total").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">{t("seller.orders.status").toUpperCase()}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/20">
                    <AnimatePresence mode="popLayout">
                       {loading && orders.length === 0 ? (
                          <TableRowSkeleton />
                       ) : orders.length === 0 ? (
                          <tr>
                             <td colSpan={5} className="px-8 py-32 text-center text-muted-foreground select-none grayscale">
                                <div className="flex flex-col items-center">
                                   <Package size={60} className="opacity-10 mb-4 animate-pulse" />
                                   <p className="text-xs font-black uppercase tracking-widest opacity-40">{t("seller.orders.no_orders_found")}</p>
                                </div>
                             </td>
                          </tr>
                       ) : (
                          orders.map((order, idx) => {
                            const customerName = order.customer.name || order.customer.email;

                            return (
                              <motion.tr
                                 key={order.id}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.03, duration: 0.2 }}
                                 onClick={() => setViewingOrder(order.id)}
                                 className="hover:bg-muted/40 transition-colors group cursor-pointer h-24"
                              >
                                 <td className="px-8 py-4">
                                    <span className="font-black text-[13px] uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                                       ORD-{order.id.toString().padStart(6, '0')}
                                    </span>
                                 </td>
                                 <td className="px-8 py-4">
                                    <span className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-tighter opacity-40">
                                       {formatDistanceToNow(new Date(order.created_at), {
                                         addSuffix: true,
                                         locale: t("locale") === "vi-VN" ? vi : enUS
                                       })}
                                    </span>
                                 </td>
                                 <td className="px-8 py-4">
                                    <div className="flex flex-col">
                                       <span className="font-black text-[13px] uppercase tracking-tight text-foreground">{customerName}</span>
                                       <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">{order.items.length} {t("seller.orders.items")}</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-4 font-black text-[14px] text-primary tabular-nums">
                                    {formatPrice(order.total_amount)}
                                 </td>
                                 <td className="px-8 py-4 text-right">
                                    <StatusBadge status={order.status} t={t} />
                                 </td>
                              </motion.tr>
                            );
                          })
                       )}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>

           {/* 4. ELITE PAGINATION (Matching Products) */}
           {totalPages > 1 && (
              <div className="p-8 border-t border-border/20 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    {t("seller.orders.pagination_page_of", { current: currentPage, total: totalPages })}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="w-12 h-12 rounded-2xl border-border/50 bg-background shadow-none flex items-center justify-center p-0"
                    >
                       <ChevronLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-2 px-2">
                       {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                             <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={cn(
                                   "w-12 h-12 rounded-2xl text-[11px] font-black transition-all",
                                   currentPage === pageNum 
                                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                      : "bg-background border border-border/50 hover:border-primary/50 text-muted-foreground"
                                )}
                             >
                                {pageNum}
                             </button>
                          );
                       })}
                    </div>
                    <Button 
                      variant="outline" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl border-border/50 bg-background shadow-none flex items-center justify-center p-0"
                    >
                       <ChevronRight size={20} />
                    </Button>
                 </div>
              </div>
           )}
        </Card>

        {/* 5. MODAL SYSTEM */}
        <AnimatePresence>
          {viewingOrder && (
            <OrderDetailsModal
              orderId={viewingOrder}
              onClose={() => setViewingOrder(null)}
              onStatusChange={updateOrderStatus}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// --- Helper Components (Matching Products Module) ---

function QuickStat({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-4 bg-muted/20 border border-border/50 px-6 py-4 rounded-[1.5rem] shadow-sm group hover:bg-muted/30 transition-all">
       <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
          <Icon size={20} strokeWidth={2.5} />
       </div>
       <div>
          <p className="text-[9px] font-black uppercase opacity-40 tracking-widest leading-none mb-1">{label}</p>
          <p className="text-[13px] font-black tracking-tight">{value}</p>
       </div>
    </div>
  );
}

function StatusBadge({ status, t }: any) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    returned: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };
  return (
    <Badge variant="outline" className={cn("px-3 py-1 h-6 rounded-full text-[9px] font-black uppercase tracking-widest border", styles[status])}>
      {t(`seller.orders.status_${status}`)}
    </Badge>
  );
}

function TableRowSkeleton() {
  return [...Array(5)].map((_, i) => (
     <tr key={i} className="h-24">
        <td className="px-8 py-4"><div className="w-full h-8 bg-muted/40 rounded-xl animate-pulse" /></td>
        <td className="px-8 py-4"><div className="w-24 h-6 bg-muted/40 rounded-xl animate-pulse" /></td>
        <td className="px-8 py-4"><div className="w-full h-10 bg-muted/40 rounded-xl animate-pulse" /></td>
        <td className="px-8 py-4"><div className="w-20 h-8 bg-muted/40 rounded-xl animate-pulse" /></td>
        <td className="px-8 py-4"><div className="w-24 h-8 bg-muted/40 rounded-xl animate-pulse ml-auto" /></td>
     </tr>
  ));
}
