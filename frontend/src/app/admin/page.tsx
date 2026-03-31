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
import { motion } from "framer-motion";

import Link from "next/link";
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
   ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminDashboardPage() {
   const { t } = useTranslation();
   const { token } = useAuthStore();
   const { formatPrice, compactPrice } = useCurrencyStore();
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

   if (!stats) return (
      <div className="min-h-screen flex items-center justify-center p-6">
         <Card className="max-w-md w-full p-12 text-center border-destructive/20 bg-destructive/5 space-y-6">
            <ShieldAlert size={64} className="mx-auto text-destructive opacity-50" />
            <div className="space-y-2">
               <h2 className="text-2xl font-black uppercase text-destructive tracking-tight">{t("admin.system_error") || "LỖI KẾT NỐI HỆ THỐNG"}</h2>
               <p className="text-xs text-destructive/60 font-medium uppercase tracking-widest">Vui lòng kiểm tra lại kết nối máy chủ API</p>
            </div>
            <Button variant="destructive" size="lg" onClick={() => window.location.reload()} className="w-full font-black uppercase tracking-widest text-[10px]">
               {t("admin.retry") || "THỬ LẠI"}
            </Button>
         </Card>
      </div>
   );

   return (
      <div className="p-6 md:p-10 space-y-8 md:space-y-12 bg-background max-w-[1600px] mx-auto overflow-hidden">

         {/* 1. Header & Quick Info */}
         <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-8 md:pb-12 gap-8">
            <div className="text-center md:text-left space-y-2">
               <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-foreground">{t("admin.system_overview")}</h1>
               <p className="text-muted-foreground font-bold text-[10px] md:text-xs uppercase opacity-70 tracking-widest">{t("admin.system_desc")}</p>
            </div>
            <Card className="bg-muted/50 px-8 py-6 border-border/50 flex items-center justify-center gap-12 rounded-3xl">
               <div className="text-center space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t("admin.total_products")}</p>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">{stats.overview.total_products || 0}</p>
               </div>
               <div className="w-px h-12 bg-border/50" />
               <div className="text-center space-y-1">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{t("admin.pending_reports")}</p>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter text-destructive">{stats.overview.pending_reports || 0}</p>
               </div>
            </Card>
         </div>

         {/* 2. Highlight Metrics Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <Card className="p-6 md:p-8 relative overflow-hidden group hover:border-primary transition-all border-border/50">
               <DollarSign className="absolute -right-6 -bottom-6 size-24 md:size-32 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all -rotate-12" />
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">{t("admin.gross_revenue")}</p>
               <h3 className="text-3xl md:text-4xl font-black tracking-tighter">{formatPrice(stats.overview.total_revenue || 0)}</h3>
               <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 mt-4 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <TrendingUp size={12} strokeWidth={3} /> +12.5% <span className="hidden xs:inline">{t("admin.from_last_month")}</span>
               </div>
            </Card>

            {/* Platform Earnings */}
            <Card className="p-6 md:p-8 relative overflow-hidden group hover:border-primary transition-all border-border/50">
               <Activity className="absolute -right-6 -bottom-6 size-24 md:size-32 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all" />
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">{t("admin.platform_earnings")}</p>
               <h3 className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{formatPrice(stats.overview.platform_earnings || 0)}</h3>
               <p className="text-[10px] font-black uppercase opacity-40 mt-4 tracking-tighter">5% {t("admin.marketplace_fee")}</p>
            </Card>

            {/* User Stats */}
            <Card className="p-6 md:p-8 group hover:border-blue-500 transition-all border-border/50">
               <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2">{t("admin.registered_customers")}</p>
               <h3 className="text-3xl md:text-4xl font-black tracking-tighter">{stats.overview.total_customers || 0}</h3>
               <div className="w-full h-1.5 bg-muted mt-6 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-blue-500" />
               </div>
            </Card>

            <Card className="p-6 md:p-8 group hover:border-purple-500 transition-all border-border/50 text-wrap">
               <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest mb-2">{t("admin.active_sellers")}</p>
               <h3 className="text-3xl md:text-4xl font-black tracking-tighter">{stats.overview.total_sellers || 0}</h3>
               <div className="w-full h-1.5 bg-muted mt-6 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-purple-500" />
               </div>
            </Card>
         </div>

         {/* 3. Visualization Charts */}
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* System Performance (Revenue/Profit) */}
            <Card className="xl:col-span-2 border-border/50">
               <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-xl font-black uppercase tracking-tight">{t("admin.performance_visual") || "Hiệu Suất Hệ Thống"}</CardTitle>
                     <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">7 {t("admin.days_history") || "ngày gần nhất"}</p>
                  </div>
                  <div className="flex gap-6">
                     <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,77,0,0.3)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{t("admin.gross_revenue") || "Revenue"}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(0,102,255,0.3)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{t("admin.platform_earnings") || "Profit"}</span>
                     </div>
                  </div>
               </CardHeader>

               <CardContent className="h-[300px] md:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={stats.trends.daily}>
                        <defs>
                           <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#ff4d00" stopOpacity={0} />
                           </linearGradient>
                           <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0066ff" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                        <XAxis
                           dataKey="date"
                           tick={{ fontSize: 9, fontWeight: 900, fill: '#6B7280' }}
                           axisLine={false}
                           tickLine={false}
                           tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                           dy={10}
                        />
                        <YAxis
                           tick={{ fontSize: 9, fontWeight: 900, fill: '#6B7280' }}
                           axisLine={false}
                           tickLine={false}
                           tickFormatter={(val) => compactPrice(val)}
                           width={45}
                        />
                        <Tooltip
                           contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', padding: '12px' }}
                           itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                           labelStyle={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.5 }}
                        />
                        <Area type="monotone" dataKey="total_revenue" stroke="#ff4d00" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="total_earnings" stroke="#0066ff" strokeWidth={3} fillOpacity={1} fill="url(#colorEarn)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            {/* Risk Trend Chart */}
            <Card className="border-border/50">
               <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                     <Shield size={20} className="text-destructive" />
                     {t("admin.risk_analysis") || "Phân Tích Rủi Ro"}
                  </CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">{t("admin.risk_analysis_desc") || "Tần suất báo lỗi hệ thống"}</p>
               </CardHeader>

               <CardContent className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.trends.risk}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                        <XAxis
                           dataKey="date"
                           tick={{ fontSize: 9, fontWeight: 900, fill: '#6B7280' }}
                           axisLine={false}
                           tickLine={false}
                           tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                        />
                        <YAxis hide />
                        <Tooltip
                           cursor={{ fill: '#f8f8f8', radius: 8 }}
                           contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', fontSize: '10px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="report_count" radius={[6, 6, 0, 0]}>
                           {stats.trends.risk.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.report_count > 5 ? '#ef4444' : entry.report_count > 2 ? '#f59e0b' : '#10b981'} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </CardContent>
               <div className="mx-6 mb-6 p-4 bg-muted/50 border border-dashed border-border/50 flex items-center justify-between gap-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">{t("admin.risk_level_today")}</p>
                  <span className={`px-4 py-1 text-[10px] font-black uppercase rounded-full shadow-sm ${stats.overview.pending_reports > 10 ? 'bg-destructive text-white' : stats.overview.pending_reports > 5 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                     {stats.overview.pending_reports > 10 ? t("admin.risk_high") : stats.overview.pending_reports > 5 ? t("admin.risk_medium") : t("admin.risk_low")}
                  </span>
               </div>
            </Card>
         </div>

         {/* 4. Alerts & Recent Activity */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 md:gap-14">
            {/* System Alerts */}
            <div className="space-y-6">
               <div className="flex items-center justify-between gap-6">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-destructive">
                     <AlertTriangle className="size-6 md:size-8" />
                     <span className="truncate">{t("admin.latest_alerts") || "Cảnh Báo Hệ Thống"}</span>
                  </h2>
                  <Button asChild variant="ghost" className="text-[10px] font-black uppercase tracking-widest gap-2 bg-destructive/5 hover:bg-destructive/10 text-destructive border-none">
                     <Link href="/admin/ai-security">
                        {t("admin.check_with_ai") || "Check with AI"} <ArrowUpRight size={14} />
                     </Link>
                  </Button>
               </div>

               <div className="space-y-4">
                  {stats.recent_alerts?.length > 0 ? stats.recent_alerts.slice(0, 5).map((alert: any) => (
                     <Link key={alert.id} href="/admin/ai-security" className="block group">
                        <Card className="p-4 md:p-6 hover:border-destructive transition-all border-border/50 relative overflow-hidden">
                           <div className="flex items-center gap-4 md:gap-6 relative z-10">
                              <div className="w-12 h-12 md:w-14 md:h-14 bg-destructive/10 flex items-center justify-center text-destructive shrink-0 rounded-2xl group-hover:scale-110 transition-transform">
                                 <ShieldAlert className="size-8 md:size-10" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black bg-muted px-2 py-0.5 rounded-lg uppercase tracking-widest opacity-70">{t("admin.moderation_nav") || "Moderation"}</span>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{format(new Date(alert.created_at), 'HH:mm - dd/MM')}</span>
                                 </div>
                                 <p className="font-black text-sm md:text-base truncate uppercase tracking-tight text-foreground/90">{alert.reason}</p>
                                 <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                    {t("admin.reported_by")}: <span className="text-foreground/60">{alert.reporter?.name || t("admin.system_user") || 'System'}</span>
                                 </p>
                              </div>
                              <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                 <ExternalLink size={24} className="text-destructive" />
                              </div>
                           </div>
                        </Card>
                     </Link>
                  )) : (
                     <div className="p-12 md:p-20 text-center border-2 border-dashed border-border/50 opacity-20 select-none rounded-[2rem]">
                        <Shield className="size-12 md:size-16 mx-auto mb-6 text-muted-foreground" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">{t("admin.no_alerts") || "Không có cảnh báo mới"}</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Latest Orders Snapshot */}
            <div className="space-y-6">
               <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <ShoppingCart className="size-6 md:size-8" />
                  {t("admin.latest_orders")}
               </h2>
               <Card className="border-border/50 overflow-hidden shadow-2xl shadow-primary/5">
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-[10px] md:text-[11px] uppercase font-bold text-left border-collapse min-w-[350px]">
                        <thead className="bg-muted/50 text-muted-foreground font-black border-b border-border/50">
                           <tr>
                              <th className="px-6 py-5 tracking-widest">{t("admin.id")} / {t("admin.date")}</th>
                              <th className="px-6 py-5 tracking-widest">{t("admin.partners")}</th>
                              <th className="px-6 py-5 text-right tracking-widest">{t("admin.amount")}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                           {stats.recent_orders?.slice(0, 5).map((o: any) => (
                              <tr key={o.id} className="hover:bg-muted/40 transition-colors group">
                                 <td className="px-6 py-5">
                                    <p className="font-black text-sm md:text-base tracking-tighter text-foreground/80">#{(o.id).toString().padStart(6, '0')}</p>
                                    <p className="opacity-40 mt-1 font-mono text-[9px] md:text-[10px] tracking-widest">{format(new Date(o.created_at), "dd/MM/yyyy")}</p>
                                 </td>
                                 <td className="px-6 py-5 space-y-1.5 min-w-[200px]">
                                    <div className="flex items-center gap-2 group/nick">
                                       <span className="text-primary font-black opacity-40 px-1 border border-primary/20 rounded text-[8px] tracking-widest">C</span> 
                                       <span className="truncate max-w-[150px] opacity-70 group-hover/nick:opacity-100 group-hover/nick:text-primary transition-all uppercase tracking-tight">{o.customer?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 group/nick">
                                       <span className="text-purple-600 font-black opacity-40 px-1 border border-purple-500/20 rounded text-[8px] tracking-widest">S</span> 
                                       <span className="truncate max-w-[150px] opacity-70 group-hover/nick:opacity-100 group-hover/nick:text-purple-600 transition-all uppercase tracking-tight">{o.seller?.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5 text-right">
                                    <p className="font-black text-primary text-base md:text-lg tracking-tighter">{formatPrice(o.total_amount)}</p>
                                    <span className="text-[8px] font-black opacity-30 tracking-widest uppercase">{o.status || 'Success'}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
}
