"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";

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

  if (loading) return <FullPageLoader />;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat(t("locale"), { style: 'currency', currency: t("currency_code") }).format(val);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-background">
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter">{t("seller.dashboard")}</h1>
        <p className="text-muted-foreground font-bold text-sm uppercase opacity-60 tracking-widest">{t("seller.overview_desc")}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card p-6 border-2 border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{t("seller.total_revenue")}</p>
            <DollarSign size={20} className="text-primary" />
          </div>
          <p className="text-3xl font-black">{formatPrice(stats?.total_revenue || 0)}</p>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-1 text-[10px] font-bold uppercase">
            <span className="flex items-center text-primary"><ArrowUpRight size={14} /> 12.5%</span> {t("seller.from_last_month")}
          </div>
        </div>

        <div className="bg-card p-6 border-2 border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{t("seller.total_orders")}</p>
            <ShoppingCart size={20} className="text-primary" />
          </div>
          <p className="text-3xl font-black">{stats?.total_orders || 0}</p>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-1 text-[10px] font-bold uppercase">
            <span className="flex items-center text-primary"><ArrowUpRight size={14} /> 4.1%</span> {t("seller.from_last_month")}
          </div>
        </div>

        <div className="bg-card p-6 border-2 border-border">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{t("seller.total_products")}</p>
            <Package size={20} className="text-primary" />
          </div>
          <p className="text-3xl font-black">{stats?.total_products || 0}</p>
          <div className="mt-4 pt-4 border-t border-border text-[10px] font-bold uppercase">
            {t("seller.manage_inventory")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card border-2 border-border p-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
            <h2 className="text-lg font-black uppercase tracking-tight">{t("seller.recent_orders")}</h2>
            <Link href="/seller/orders" className="text-xs font-bold uppercase border-2 border-primary px-3 py-1 hover:bg-primary hover:text-white">{t("view_all")}</Link>
          </div>

          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs uppercase font-bold">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 border border-border">KHÁCH HÀNG</th>
                    <th className="px-4 py-2 border border-border text-right">TỔNG TIỀN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recent_orders.map(order => (
                    <tr key={order.id} className="hover:bg-muted">
                      <td className="px-4 py-3 border border-border">
                        <span className="text-foreground">
                          {order.customer.name || order.customer.email}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(order.created_at), {
                            addSuffix: true,
                            locale: t("locale").includes("vi") ? vi : enUS
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 border border-border text-right font-black text-primary">
                        {formatPrice(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Clock size={40} className="opacity-20 mb-2" />
              <p className="text-xs font-bold uppercase">{t("seller.no_orders")}</p>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border-2 border-border p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-black uppercase tracking-tight mb-6 self-start border-b border-border w-full text-left pb-2">{t("seller.low_stock_alerts")}</h2>
          <Package size={48} className="opacity-10 mb-4" />
          <p className="text-xs font-bold uppercase text-muted-foreground">{t("seller.stock_sufficient")}</p>
        </div>
      </div>
    </div>
  );
}
