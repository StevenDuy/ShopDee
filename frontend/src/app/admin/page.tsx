"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Users, Building, ShoppingCart, DollarSign, Activity, PackageSearch } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <FullPageLoader />;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(t("locale"), { 
      style: 'currency', 
      currency: t("currency_code") 
    }).format(val);
  };

  if (!stats) return <div className="p-8 text-center font-bold uppercase border-2 border-destructive">LỖI TẢI DỮ LIỆU</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-background">
      <div className="border-l-8 border-primary pl-4 bg-muted/50 py-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">{t("admin.system_overview")}</h1>
        <p className="text-muted-foreground font-bold text-sm uppercase opacity-60 tracking-widest">{t("admin.system_desc")}</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border-2 border-border p-6 flex flex-col justify-center gap-2">
           <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest">
              <DollarSign size={16} className="text-primary" />
              {t("admin.gross_revenue")}
           </div>
           <h3 className="text-3xl font-black">{formatCurrency(stats.overview.total_revenue || 0)}</h3>
        </div>

        <div className="bg-card border-2 border-border p-6 flex flex-col justify-center gap-2">
           <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest">
              <Activity size={16} className="text-primary" />
              {t("admin.platform_earnings")}
           </div>
           <h3 className="text-3xl font-black text-primary">{formatCurrency(stats.overview.platform_earnings || 0)}</h3>
        </div>

        <div className="bg-card border-2 border-border p-6 flex flex-col justify-center gap-2">
           <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest">
              <PackageSearch size={16} className="text-primary" />
              {t("admin.total_products")}
           </div>
           <h3 className="text-3xl font-black">{stats.overview.total_products || 0}</h3>
           {stats.overview.pending_approvals > 0 && (
               <p className="text-[10px] font-black text-primary uppercase mt-1 border border-primary px-2 py-0.5 self-start">
                 {stats.overview.pending_approvals} {t("admin.pending_approval")}
               </p>
           )}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border-2 border-blue-500 p-6 flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{t("admin.registered_customers")}</p>
            <h3 className="text-4xl font-black text-blue-600">{stats.overview.total_customers || 0}</h3>
          </div>
          <Users size={48} className="text-blue-500 opacity-20" />
        </div>

        <div className="bg-card border-2 border-purple-500 p-6 flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">{t("admin.active_sellers")}</p>
            <h3 className="text-4xl font-black text-purple-600">{stats.overview.total_sellers || 0}</h3>
          </div>
          <Building size={48} className="text-purple-500 opacity-20" />
        </div>
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* Recent Users */}
         <div className="bg-card border-2 border-border">
            <div className="px-6 py-4 border-b-2 border-border bg-muted flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <h2 className="text-lg font-black uppercase">{t("admin.newest_users")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs uppercase font-bold text-left border-collapse">
                <thead className="bg-muted text-muted-foreground font-black">
                  <tr>
                    <th className="px-4 py-3 border border-border">{t("admin.user")}</th>
                    <th className="px-4 py-3 border border-border">{t("admin.role")}</th>
                    <th className="px-4 py-3 border border-border">{t("admin.joined")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recent_users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted">
                      <td className="px-4 py-4 border border-border">
                        <p className="font-black text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-4 py-4 border border-border">
                         <span className="inline-block border border-current px-2 py-0.5">
                           {t(`roles.${u.role?.slug || 'customer'}`)}
                         </span>
                      </td>
                      <td className="px-4 py-4 border border-border font-mono text-muted-foreground">
                        {format(new Date(u.created_at), "dd/MM/yyyy", { 
                          locale: t("locale").includes("vi") ? vi : enUS 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>

         {/* Recent Orders */}
         <div className="bg-card border-2 border-border">
            <div className="px-6 py-4 border-b-2 border-border bg-muted flex items-center gap-2">
              <ShoppingCart className="text-primary" size={20} />
              <h2 className="text-lg font-black uppercase">{t("admin.latest_orders")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs uppercase font-bold text-left border-collapse">
                <thead className="bg-muted text-muted-foreground font-black">
                  <tr>
                    <th className="px-4 py-3 border border-border">#ID / NGÀY</th>
                    <th className="px-4 py-3 border border-border">ĐỐI TÁC</th>
                    <th className="px-4 py-3 border border-border text-right">TỔNG TIỀN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recent_orders?.map((o: any) => (
                    <tr key={o.id} className="hover:bg-muted">
                      <td className="px-4 py-4 border border-border">
                        <p className="font-black">#{(o.id).toString().padStart(6,'0')}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                          {format(new Date(o.created_at), "dd/MM/yyyy", { 
                            locale: t("locale").includes("vi") ? vi : enUS 
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-4 border border-border text-[10px]">
                        <p><span className="text-muted-foreground">C:</span> {o.customer?.name}</p>
                        <p><span className="text-muted-foreground">S:</span> {o.seller?.name}</p>
                      </td>
                      <td className="px-4 py-4 border border-border text-right font-black text-primary">
                        {formatCurrency(o.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    </div>
  );
}
