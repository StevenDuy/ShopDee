"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  Users, Building, ShoppingCart, DollarSign, Activity, 
  PackageSearch, AlertTriangle, Shield, TrendingUp, 
  ArrowUpRight, ExternalLink, ShieldAlert
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import FullPageLoader from "@/components/FullPageLoader";
import Link from "next/link";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { useCurrencyStore } from "@/store/useCurrencyStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { currency, formatPrice, compactPrice } = useCurrencyStore();
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

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-12 text-center border-4 border-destructive bg-destructive/5 space-y-4">
        <ShieldAlert size={64} className="mx-auto text-destructive" />
        <h2 className="text-2xl font-black uppercase text-destructive tracking-tighter">{t("admin.system_error") || "LỖI KẾT NỐI HỆ THỐNG"}</h2>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-destructive text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">{t("admin.retry") || "THỬ LẠI"}</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-10 bg-background max-w-[1600px] mx-auto overflow-hidden">
      
      {/* 1. Header & Quick Info */}
      <div className="flex flex-col items-center justify-center text-center border-b-8 border-primary pb-8 gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">{t("admin.system_overview")}</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase opacity-60 tracking-[0.2em] mt-3">{t("admin.system_desc")}</p>
        </div>
        <div className="bg-primary/5 px-4 md:px-8 py-4 border-2 border-primary/20 flex flex-wrap items-center justify-center gap-4 md:gap-10">
           <div className="text-center">
              <p className="text-[10px] font-black opacity-40 uppercase">{t("admin.total_products")}</p>
              <p className="text-xl font-black">{stats.overview.total_products || 0}</p>
           </div>
           <div className="hidden sm:block w-px h-8 bg-primary/20" />
           <div className="text-center">
              <p className="text-[10px] font-black opacity-40 uppercase">{t("admin.pending_reports")}</p>
              <p className="text-xl font-black text-red-500">{stats.overview.pending_reports || 0}</p>
           </div>
        </div>
      </div>

      {/* 2. Highlight Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-card border-2 border-border p-6 relative overflow-hidden group hover:border-primary transition-all">
           <DollarSign className="absolute -right-4 -bottom-4 size-24 opacity-5 group-hover:opacity-10 transition-all -rotate-12" />
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t("admin.gross_revenue")}</p>
           <h3 className="text-3xl font-black">{formatPrice(stats.overview.total_revenue || 0)}</h3>
           <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 mt-2">
              <TrendingUp size={12} /> +12.5% {t("admin.from_last_month")}
           </div>
        </div>

        {/* Platform Earnings */}
        <div className="bg-card border-2 border-border p-6 relative overflow-hidden group hover:border-primary transition-all">
           <Activity className="absolute -right-4 -bottom-4 size-24 opacity-5 group-hover:opacity-10 transition-all" />
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{t("admin.platform_earnings")}</p>
           <h3 className="text-3xl font-black text-primary">{formatPrice(stats.overview.platform_earnings || 0)}</h3>
           <p className="text-[10px] font-black uppercase opacity-40 mt-2">5% {t("admin.marketplace_fee")}</p>
        </div>

        {/* User Stats */}
        <div className="bg-card border-2 border-border p-6 group hover:border-blue-500 transition-all">
           <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">{t("admin.registered_customers")}</p>
           <h3 className="text-3xl font-black">{stats.overview.total_customers || 0}</h3>
           <div className="w-full h-1 bg-muted mt-4">
              <div className="h-full bg-blue-500" style={{ width: '70%' }} />
           </div>
        </div>

        <div className="bg-card border-2 border-border p-6 group hover:border-purple-500 transition-all">
           <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest mb-1">{t("admin.active_sellers")}</p>
           <h3 className="text-3xl font-black">{stats.overview.total_sellers || 0}</h3>
           <div className="w-full h-1 bg-muted mt-4">
              <div className="h-full bg-purple-500" style={{ width: '40%' }} />
           </div>
        </div>
      </div>

      {/* 3. Visualization Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         {/* System Performance (Revenue/Profit) */}
         <div className="xl:col-span-2 bg-card border-2 border-border p-6">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{t("admin.performance_visual") || "Hiệu Suất Hệ Thống"}</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">7 {t("admin.days_history") || "ngày gần nhất"}</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-primary rounded-full" />
                     <span className="text-[10px] font-black uppercase">{t("admin.gross_revenue") || "Revenue"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-blue-500 rounded-full" />
                     <span className="text-[10px] font-black uppercase">{t("admin.platform_earnings") || "Profit"}</span>
                  </div>
               </div>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trends.daily}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ff4d00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066ff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => compactPrice(val)}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #000', borderRadius: '0px', boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="total_revenue" stroke="#ff4d00" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="total_earnings" stroke="#0066ff" strokeWidth={4} fillOpacity={1} fill="url(#colorEarn)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Risk Trend Chart */}
         <div className="bg-card border-2 border-border p-6">
            <div className="mb-8">
               <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Shield size={20} className="text-red-500" />
                 {t("admin.risk_analysis") || "Phân Tích Rủi Ro"}
               </h2>
               <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{t("admin.risk_analysis_desc") || "Tần suất báo lỗi hệ thống"}</p>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trends.risk}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis 
                       dataKey="date" 
                       tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} 
                       axisLine={false}
                       tickLine={false}
                       tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                     />
                     <YAxis hide />
                     <Tooltip 
                       cursor={{ fill: '#f1f1f1' }}
                       contentStyle={{ borderRadius: '0px', border: '2px solid #000' }}
                     />
                     <Bar dataKey="report_count" radius={[4, 4, 0, 0]}>
                        {stats.trends.risk.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.report_count > 5 ? '#ef4444' : entry.report_count > 2 ? '#f59e0b' : '#10b981'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-muted/50 border border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-3">
               <p className="text-[10px] font-black uppercase opacity-60">{t("admin.risk_level_today")}</p>
               <span className={`px-3 py-1 text-[10px] font-black uppercase ${stats.overview.pending_reports > 5 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {stats.overview.pending_reports > 10 ? t("admin.risk_high") : stats.overview.pending_reports > 5 ? t("admin.risk_medium") : t("admin.risk_low")}
               </span>
            </div>
         </div>
      </div>

      {/* 4. Alerts & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* System Alerts */}
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2 text-red-500">
                  <AlertTriangle size={24} />
                  {t("admin.latest_alerts") || "Cảnh Báo Hành Vi Bất Thường"}
               </h2>
               <Link href="/admin/ai-security" className="text-[10px] font-black uppercase flex items-center gap-1 hover:text-primary transition-all">
                  {t("admin.check_with_ai") || "Check with AI"} <ArrowUpRight size={14} />
               </Link>
            </div>
            
            <div className="space-y-3">
               {stats.recent_alerts?.length > 0 ? stats.recent_alerts.map((alert: any) => (
                  <Link key={alert.id} href="/admin/ai-security" className="block bg-card border-2 border-border p-4 hover:border-red-500 transition-all relative group">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                           <ShieldAlert size={28} />
                        </div>
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded uppercase">{t("admin.moderation_nav") || "Moderation"}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(alert.created_at), 'HH:mm - dd/MM')}</span>
                           </div>
                           <p className="font-bold text-sm truncate uppercase tracking-tight">{alert.reason}</p>
                           <p className="text-xs text-muted-foreground mt-0.5">
                              {t("admin.reported_by")}: <span className="font-black text-foreground">{alert.reporter?.name || t("admin.system_user") || 'System'}</span>
                           </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink size={20} className="text-primary" />
                        </div>
                     </div>
                  </Link>
               )) : (
                  <div className="p-12 text-center border-2 border-dashed border-border opacity-30 select-none">
                     <Shield size={48} className="mx-auto mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">{t("admin.no_alerts") || "Không có cảnh báo mới"}</p>
                  </div>
               )}
            </div>
         </div>

         {/* Latest Orders Snapshot */}
         <div className="space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
               <ShoppingCart size={24} />
               {t("admin.latest_orders")}
            </h2>
            <div className="bg-card border-2 border-border overflow-x-auto custom-scrollbar">
               <table className="w-full text-[10px] uppercase font-bold text-left border-collapse min-w-[400px]">
                 <thead className="bg-muted text-muted-foreground font-black border-b-2 border-border">
                   <tr>
                     <th className="px-4 py-4">{t("admin.id")} / {t("admin.date")}</th>
                     <th className="px-4 py-4">{t("admin.partners")}</th>
                     <th className="px-4 py-4 text-right">{t("admin.amount")}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {stats.recent_orders?.map((o: any) => (
                     <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                       <td className="px-4 py-4">
                         <p className="font-black text-sm">#{(o.id).toString().padStart(6,'0')}</p>
                         <p className="opacity-50 mt-1 font-mono">{format(new Date(o.created_at), "dd/MM/yyyy")}</p>
                       </td>
                       <td className="px-4 py-4 opacity-70">
                         <p><span className="text-primary font-black">C:</span> {o.customer?.name}</p>
                         <p><span className="text-purple-600 font-black">S:</span> {o.seller?.name}</p>
                       </td>
                       <td className="px-4 py-4 text-right font-black text-primary text-base">
                         {formatPrice(o.total_amount)}
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
