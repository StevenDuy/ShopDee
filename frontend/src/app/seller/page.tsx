"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Clock, Eye } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const API = "http://localhost:8000/api";

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
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/seller/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching dashboard stats", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
     return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
             <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
             <p>{t("loading")}</p>
          </div>
        </div>
     );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("seller.dashboard")}</h1>
        <p className="text-muted-foreground mt-1">{t("seller.overview_desc")}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t("seller.total_revenue")}</p>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">
             {new Intl.NumberFormat(t("locale"), { style: 'currency', currency: t("currency_code") }).format(stats?.total_revenue || 0)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center text-green-600"><ArrowUpRight size={16}/> 12.5%</span> {t("seller.from_last_month")}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t("seller.total_orders")}</p>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">{stats?.total_orders || 0}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
             <span className="flex items-center text-green-600"><ArrowUpRight size={16}/> 4.1%</span> {t("seller.from_last_month")}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t("seller.total_products")}</p>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Package size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">{stats?.total_products || 0}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
             {t("seller.manage_inventory")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t("seller.recent_orders")}</h2>
            <Link href="/seller/orders" className="text-sm text-primary font-medium hover:underline">{t("view_all")}</Link>
          </div>
          
          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
             <div className="flex-1 -mx-6 mb-[-24px]">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <tbody className="divide-y divide-border">
                     {stats.recent_orders.map(order => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                           <td className="px-6 py-3">
                              <span className="font-medium text-foreground">
                                 {order.customer.name || order.customer.email}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                 {formatDistanceToNow(new Date(order.created_at), { 
                                   addSuffix: true,
                                   locale: t("locale") === "vi-VN" ? vi : enUS
                                 })}
                              </span>
                           </td>
                           <td className="px-6 py-3 font-medium text-right">
                              {new Intl.NumberFormat(t("locale"), { style: 'currency', currency: t("currency_code") }).format(order.total_amount)}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 my-auto text-muted-foreground">
               <Clock size={48} className="opacity-20 mb-4" />
               <p>{t("seller.no_orders")}</p>
             </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{t("seller.low_stock_alerts")}</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Package size={48} className="opacity-20 mb-4" />
            <p>{t("seller.stock_sufficient")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
