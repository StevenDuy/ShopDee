"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, Search, Filter, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminModerationPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchProducts = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/moderation/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }
      });
      setProducts(res.data.data);
      setPagination({
         current_page: res.data.current_page,
         last_page: res.data.last_page,
         total: res.data.total
      });
    } catch (err) {
      console.error("Failed to load products for moderation", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [token, statusFilter, search]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      await axios.put(`${API_URL}/admin/moderation/products/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts(pagination.current_page);
    } catch (err: any) {
      alert(t("admin.system_config.update_error") || "Failed to update product status.");
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!token) return;
    if (!confirm(t("admin.moderation.delete_confirm", { name }))) return;
    try {
      await axios.delete(`${API_URL}/admin/moderation/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts(pagination.current_page);
    } catch (err: any) {
      alert(t("admin.system_config.update_error") || "Failed to delete product.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-xs font-bold uppercase">{t("admin.moderation.status_published")}</span>;
      case 'draft': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md text-xs font-bold uppercase">{t("admin.moderation.status_draft")}</span>;
      case 'archived': return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-bold uppercase">{t("admin.moderation.status_archived")}</span>;
      default: return <span className="px-2 py-1 bg-muted/50 rounded-md text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.moderation.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.moderation.desc")}</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder={t("products_page.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl text-sm">
                <Filter size={16} className="text-muted-foreground" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none min-w-[130px]"
                >
                  <option value="all">{t("admin.users_manage.all_roles")}</option>
                  <option value="draft">{t("admin.moderation.status_draft")}</option>
                  <option value="published">{t("admin.moderation.status_published")}</option>
                  <option value="archived">{t("admin.moderation.status_archived")}</option>
                </select>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
             <div className="flex h-64 items-center justify-center">
               <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
             </div>
          ) : products.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">
               <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
               <p>{t("admin.moderation.no_moderation")}</p>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground bg-muted/50 uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">{t("admin.moderation.product_seller")}</th>
                  <th className="px-6 py-4 hidden sm:table-cell">{t("seller.products_manage.category")}</th>
                  <th className="px-6 py-4">{t("seller.products_manage.status")}</th>
                  <th className="px-6 py-4 text-right">{t("seller.orders.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {p.media && p.media.length > 0 ? (
                               <img src={p.media[0].file_path} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                               <span className="text-xs text-muted-foreground">No img</span>
                            )}
                         </div>
                         <div>
                            <p className="font-bold line-clamp-1" title={p.name}>{p.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5" title={p.seller?.name}>{t("admin.user")}: {p.seller?.name}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                       <span className="bg-muted px-2 py-1 rounded text-[11px] font-medium">{p.category?.name || t("admin.moderation.uncategorized")}</span>
                    </td>
                    <td className="px-6 py-4">
                       {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.status !== 'published' && (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'published')}
                              className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-md transition-colors"
                              title={t("admin.moderation.approve_publish") || "Approve"}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          {p.status !== 'archived' && (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'archived')}
                              className="p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-md transition-colors"
                              title={t("admin.moderation.archive_hide") || "Archive"}
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                            title={t("admin.moderation.force_delete") || "Delete"}
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("admin.users_manage.page_of", { current: pagination.current_page, total: pagination.last_page })}
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[...Array(pagination.last_page)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => fetchProducts(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${pagination.current_page === i + 1 ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-background border border-border hover:bg-accent"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
