"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, Search, Filter, CheckCircle, XCircle, Trash2, Eye, Flag, User, MessageSquare, Star } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminModerationPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState("products"); // "products" or "reports"
  
  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const fetchReports = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/moderation/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined
        }
      });
      setReports(res.data.data);
      setPagination({
         current_page: res.data.current_page,
         last_page: res.data.last_page,
         total: res.data.total
      });
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
        fetchProducts(1);
    } else {
        fetchReports(1);
    }
  }, [token, statusFilter, search, activeTab, typeFilter]);

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

  const handleUpdateReport = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      await axios.put(`${API_URL}/admin/moderation/reports/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports(pagination.current_page);
    } catch (err: any) {
      alert(t("admin.moderation.update_report_error") || "Failed to update report status.");
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
      case 'published': 
      case 'resolved': return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-xs font-bold uppercase">{t(`admin.moderation.status_${status}`)}</span>;
      case 'draft': 
      case 'pending': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md text-xs font-bold uppercase">{t(`admin.moderation.status_${status}`)}</span>;
      case 'archived': 
      case 'dismissed': return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-bold uppercase">{t(`admin.moderation.status_${status}`)}</span>;
      default: return <span className="px-2 py-1 bg-muted/50 rounded-md text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">{t("admin.moderation.title")}</h1>
           <p className="text-muted-foreground mt-1">{t("admin.moderation.desc")}</p>
        </div>

        <div className="flex bg-muted p-1 rounded-xl">
           <button 
             onClick={() => { setActiveTab("products"); setStatusFilter("all"); setSearch(""); }}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "products" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
           >
             {t("admin.moderation.tab_products")}
           </button>
           <button 
             onClick={() => { setActiveTab("reports"); setStatusFilter("all"); setSearch(""); }}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "reports" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
           >
             {t("admin.moderation.tab_reports")}
           </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm">
          {activeTab === "products" ? (
             <div className="relative w-full sm:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
               <input 
                 type="text" 
                 placeholder={t("products_page.search_placeholder")}
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
               />
             </div>
          ) : (
             <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl">
                <Filter size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{t("admin.role")}:</span>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold"
                >
                  <option value="all">{t("admin.users_manage.all_roles")}</option>
                  <option value="product">{t("admin.moderation.type_product")}</option>
                  <option value="user">{t("admin.moderation.type_user")}</option>
                  <option value="review">{t("admin.moderation.type_review")}</option>
                  <option value="message">{t("admin.moderation.type_message")}</option>
                </select>
             </div>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl">
                <Filter size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{t("seller.orders.status")}:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold min-w-[100px]"
                >
                  <option value="all">{t("admin.users_manage.all_roles")}</option>
                  {activeTab === "products" ? (
                    <>
                      <option value="draft">{t("admin.moderation.status_draft")}</option>
                      <option value="published">{t("admin.moderation.status_published")}</option>
                      <option value="archived">{t("admin.moderation.status_archived")}</option>
                    </>
                  ) : (
                    <>
                       <option value="pending">{t("admin.moderation.status_pending")}</option>
                       <option value="resolved">{t("admin.moderation.status_resolved")}</option>
                       <option value="dismissed">{t("admin.moderation.status_dismissed")}</option>
                    </>
                  )}
                </select>
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
             <div className="flex h-64 items-center justify-center">
               <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
             </div>
          ) : activeTab === "products" ? (
             // Products Table 
             products.length === 0 ? (
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
                                 title={t("admin.moderation.approve_publish")}
                               >
                                 <CheckCircle size={16} />
                               </button>
                             )}
                             
                             {p.status !== 'archived' && (
                               <button 
                                 onClick={() => handleUpdateStatus(p.id, 'archived')}
                                 className="p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-md transition-colors"
                                 title={t("admin.moderation.archive_hide")}
                               >
                                 <XCircle size={16} />
                               </button>
                             )}
   
                             <button 
                               onClick={() => handleDeleteProduct(p.id, p.name)}
                               className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                               title={t("admin.moderation.force_delete")}
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )
          ) : (
             // Reports Table
             reports.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Flag size={48} className="mx-auto mb-4 opacity-20" />
                  <p>{t("admin.moderation.no_reports")}</p>
                </div>
             ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground bg-muted/50 uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">{t("admin.moderation.report_reporter")}</th>
                      <th className="px-6 py-4">{t("admin.moderation.report_target")}</th>
                      <th className="px-6 py-4">{t("admin.moderation.report_reason")}</th>
                      <th className="px-6 py-4">{t("admin.moderation.report_status")}</th>
                      <th className="px-6 py-4 text-right">{t("seller.orders.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 group align-top">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <User size={14} className="text-muted-foreground" />
                              <div>
                                 <p className="font-bold">{r.reporter?.name}</p>
                                 <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), 'HH:mm dd/MM/yyyy')}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {r.reported_product_id && (
                              <div className="flex items-center gap-2">
                                 <ShieldAlert size={14} className="text-amber-500" />
                                 <span className="font-medium line-clamp-1">{t("admin.moderation.type_product")}: {r.reported_product?.name}</span>
                              </div>
                           )}
                           {r.reported_user_id && (
                              <div className="flex items-center gap-2">
                                 <User size={14} className="text-purple-500" />
                                 <span className="font-medium line-clamp-1">{t("admin.moderation.type_user")}: {r.reported_user?.name}</span>
                              </div>
                           )}
                           {r.reported_review_id && (
                              <div className="flex items-center gap-2">
                                 <Star size={14} className="text-amber-400" />
                                 <span className="font-medium line-clamp-1">{t("admin.moderation.type_review")}: {r.reported_review?.comment}</span>
                              </div>
                           )}
                           {r.reported_message_id && (
                              <div className="flex items-center gap-2">
                                 <MessageSquare size={14} className="text-blue-500" />
                                 <span className="font-medium line-clamp-1">{t("admin.moderation.type_message")}: {r.reported_message?.message}</span>
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <p className="line-clamp-2 text-xs italic text-muted-foreground">"{r.reason}"</p>
                        </td>
                        <td className="px-6 py-4">
                           {getStatusBadge(r.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {r.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleUpdateReport(r.id, 'resolved')}
                                  className="px-2 py-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-md text-xs font-bold transition-all"
                                >
                                  {t("admin.moderation.action_resolve")}
                                </button>
                                <button 
                                  onClick={() => handleUpdateReport(r.id, 'dismissed')}
                                  className="px-2 py-1 bg-muted text-muted-foreground hover:bg-foreground hover:text-background rounded-md text-xs font-bold transition-all"
                                >
                                  {t("admin.moderation.action_dismiss")}
                                </button>
                              </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )
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
                  onClick={() => activeTab === "products" ? fetchProducts(i + 1) : fetchReports(i + 1)}
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
