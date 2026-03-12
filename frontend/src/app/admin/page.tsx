"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Users, Building, ShoppingCart, DollarSign, Activity, PackageSearch } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminDashboardPage() {
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) {
     return (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time statistics for the entire ShopDee platform.</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl">
              <DollarSign size={28} />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Gross Platform Revenue</p>
             <h3 className="text-2xl font-black mt-0.5">{formatCurrency(stats.overview.total_revenue || 0)}</h3>
           </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <Activity size={28} />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Platform Earnings (5% Fee)</p>
             <h3 className="text-2xl font-black mt-0.5 text-primary">{formatCurrency(stats.overview.platform_earnings || 0)}</h3>
           </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
           <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
              <PackageSearch size={28} />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Total Products</p>
             <h3 className="text-2xl font-black mt-0.5">{stats.overview.total_products || 0}</h3>
             {stats.overview.pending_approvals > 0 && (
                 <p className="text-xs font-semibold text-amber-500 mt-1">{stats.overview.pending_approvals} pending approval</p>
             )}
           </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-6 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600/80 uppercase tracking-wider">Registered Customers</p>
            <h3 className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.overview.total_customers || 0}</h3>
          </div>
          <Users size={48} className="text-blue-500/20" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-6 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-purple-600/80 uppercase tracking-wider">Active Sellers</p>
            <h3 className="text-3xl font-black mt-1 text-purple-600 dark:text-purple-400">{stats.overview.total_sellers || 0}</h3>
          </div>
          <Building size={48} className="text-purple-500/20" />
        </div>
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4">
         {/* Recent Users */}
         <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <h2 className="text-lg font-bold">Newest Registered Users</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recent_users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                           u.role_id === 1 ? 'bg-blue-500/10 text-blue-500' :
                           u.role_id === 2 ? 'bg-purple-500/10 text-purple-500' :
                           'bg-red-500/10 text-red-500'
                         }`}>
                           {u.role?.name || "Unknown"}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                  {stats.recent_users?.length === 0 && (
                     <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No recent users.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>

         {/* Recent Orders */}
         <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center gap-2">
              <ShoppingCart className="text-primary" size={20} />
              <h2 className="text-lg font-bold">Latest Orders</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order / Date</th>
                    <th className="px-6 py-4 font-medium">Participants</th>
                    <th className="px-6 py-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recent_orders?.map((o: any) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-bold">#{(o.id).toString().padStart(6,'0')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p><span className="text-muted-foreground">C:</span> {o.customer?.name}</p>
                        <p><span className="text-muted-foreground">S:</span> {o.seller?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-500">
                        {formatCurrency(o.total_amount)}
                      </td>
                    </tr>
                  ))}
                  {stats.recent_orders?.length === 0 && (
                     <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No recent orders.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    </div>
  );
}
