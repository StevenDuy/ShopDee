"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, Package, ShoppingCart, ArrowUpRight, Clock, 
  TrendingUp, Activity, Box, BarChart3, ChevronRight, 
  Store, ListOrdered, AlertCircle, Sparkles
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type DashboardStats = {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  recent_orders: {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
    customer: { name: string; email: string };
  }[];
};

export default function SellerDashboard() {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/seller/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching dashboard stats", err))
      .finally(() => setLoading(false));
  }, [token]);

  const { formatPrice } = useCurrencyStore();

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* 1. ELITE SELLER HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Store size={22} strokeWidth={2.5} />
                 </div>
                  <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                   <span className="text-white/40">{t("seller.center")}</span>
                  </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                {user?.name?.toUpperCase() || t("seller.store_label")}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-medium">
                  {t("dashboard_v2.performance")}
                </span>
              </h1>
           </div>
           
           <div className="hidden lg:flex items-center gap-6 bg-muted/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 shadow-sm">
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("seller.total_revenue")}</p>
                 <p className="text-2xl font-black text-primary leading-none">{formatPrice(stats?.total_revenue || 0)}</p>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t("seller.total_orders")}</p>
                 <p className="text-2xl font-black text-foreground leading-none">{stats?.total_orders || 0}</p>
              </div>
           </div>
        </div>

        {/* 2. STATS GRID - Flat-Zoom Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <StatsCard 
              label={t("seller.total_revenue")}
              value={formatPrice(stats?.total_revenue || 0)}
              icon={DollarSign}
              trend="+12.5%"
              delay={0}
              t={t}
           />
           <StatsCard 
              label={t("seller.total_orders")}
              value={stats?.total_orders?.toString() || "0"}
              icon={ShoppingCart}
              trend="+4.1%"
              delay={0.1}
              t={t}
           />
           <StatsCard 
              label={t("seller.total_products")}
              value={stats?.total_products?.toString() || "0"}
              icon={Package}
              subLabel={t("seller.manage_inventory")}
              delay={0.2}
              t={t}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* 3. RECENT ORDERS TABLE */}
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <ListOrdered size={26} className="text-primary" /> {t("seller.recent_orders")}
                 </h2>
                 <Link href="/seller/orders">
                    <Button variant="outline" className="h-10 rounded-xl font-black text-[9px] uppercase tracking-widest border-border/50 hover:text-primary transition-all">
                       {t("view_all")} <ChevronRight size={14} className="ml-1" />
                    </Button>
                 </Link>
              </div>

              <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                 <div className="overflow-x-auto custom-scrollbar">
                    {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                       <table className="w-full text-left border-separate border-spacing-0">
                          <thead className="bg-muted/30 border-b border-border/30 text-muted-foreground">
                             <tr>
                                <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("customer_manage.name").toUpperCase()}</th>
                                <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("order_manage.status").toUpperCase()}</th>
                                <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">{t("order_manage.total").toUpperCase()}</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                             {stats.recent_orders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/40 transition-colors group cursor-pointer h-20">
                                   <td className="px-8 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center font-black text-primary transition-all group-hover:scale-110">
                                            {(order.customer.name || "?").charAt(0).toUpperCase()}
                                         </div>
                                         <div className="min-w-0">
                                            <p className="font-black text-[11px] uppercase tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                                               {order.customer.name || order.customer.email}
                                            </p>
                                            <p className="text-[9px] font-bold opacity-40 uppercase mt-0.5 whitespace-nowrap">
                                               {formatDistanceToNow(new Date(order.created_at), {
                                                  addSuffix: true,
                                                  locale: t("locale").includes("vi") ? vi : enUS
                                               })}
                                            </p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-4">
                                      <Badge variant="outline" className="px-2 py-0.5 rounded-lg font-black text-[8px] tracking-widest uppercase border-border/50 text-muted-foreground">
                                         {order.status}
                                      </Badge>
                                   </td>
                                   <td className="px-8 py-4 text-right font-black text-[13px] text-primary tabular-nums">
                                      {formatPrice(order.total_amount)}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    ) : (
                       <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30 select-none grayscale">
                          <Activity size={80} className="mb-4 animate-pulse" strokeWidth={1} />
                          <p className="text-xs font-black uppercase tracking-widest">{t("seller.no_orders")}</p>
                       </div>
                    )}
                 </div>
              </Card>
           </div>

           {/* 4. SIDEBAR - Low Stock & Insights */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 space-y-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={120} />
                 </div>
                 
                 <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-8">{t("seller.low_stock_alerts")}</h3>
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                       <div className="w-16 h-16 rounded-[1.5rem] bg-background border border-border shadow-sm flex items-center justify-center text-primary/20 transition-transform group-hover:rotate-12">
                          <Box size={32} />
                       </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-foreground">{t("seller.stock_sufficient")}</p>
                          <p className="text-[10px] font-bold text-muted-foreground opacity-60 mt-1 uppercase tracking-widest">{t("dashboard_v2.inventory_healthy")}</p>
                        </div>
                    </div>
                 </div>

                  <div className="pt-8 border-t border-primary/10 flex items-center gap-4 group/tip">
                    <Sparkles className="text-primary shrink-0 opacity-40 group-hover/tip:opacity-100 transition-opacity" size={24} />
                    <p className="text-[11px] font-black text-muted-foreground uppercase leading-relaxed italic opacity-70">
                       &quot;{t("dashboard_v2.tip_highlight")}&quot;
                    </p>
                  </div>
              </div>

              <Card className="rounded-[3rem] border-border/30 bg-muted/40 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t("dashboard_v2.operational_status")}</p>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{t("dashboard_v2.store_online")}</span>
                    </div>
                  </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background border border-border rounded-2xl flex flex-col items-center gap-2 text-center group active:scale-95 transition-all cursor-pointer">
                        <Activity className="text-primary opacity-40 group-hover:opacity-100" size={20} />
                        <span className="text-[9px] font-black uppercase opacity-60">{t("dashboard_v2.analytics")}</span>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-2xl flex flex-col items-center gap-2 text-center group active:scale-95 transition-all cursor-pointer">
                        <BarChart3 className="text-primary opacity-40 group-hover:opacity-100" size={20} />
                        <span className="text-[9px] font-black uppercase opacity-60">{t("dashboard_v2.reports")}</span>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// --- Support Components ---

function StatsCard({ label, value, icon: Icon, trend, subLabel, delay, t }: any) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay, ease: "circOut" }}
      >
         <Card className="rounded-[2.5rem] border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden p-8 hover:shadow-xl hover:shadow-primary/5 transition-all group relative">
            <div className="absolute top-0 right-0 p-8 text-primary opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
               <Icon size={48} strokeWidth={1.5} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20">
                     <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                     {label}
                  </p>
               </div>
               
               <div>
                  <h3 className="text-3xl font-black tracking-tighter text-foreground mb-4 tabular-nums">{value}</h3>
                  {trend && (
                     <div className="flex items-center gap-2">
                        <div className="flex items-center px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                           <ArrowUpRight size={14} className="mr-0.5" /> {trend}
                        </div>
                         <span className="text-[10px] font-black uppercase opacity-20 tracking-widest tracking-tighter">{t("dashboard_v2.vs_last_month")}</span>
                     </div>
                  )}
                  {subLabel && (
                     <p className="text-[10px] font-black uppercase opacity-20 tracking-widest">
                        {subLabel}
                     </p>
                  )}
               </div>
            </div>
         </Card>
      </motion.div>
   );
}
