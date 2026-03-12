"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, Search, Filter, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminModerationPage() {
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
      alert("Failed to update product status.");
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!token) return;
    if (!confirm(`Force delete product "${name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/admin/moderation/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts(pagination.current_page);
    } catch (err: any) {
      alert("Failed to delete product.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-xs font-bold uppercase">Published</span>;
      case 'draft': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md text-xs font-bold uppercase">Draft (Pending)</span>;
      case 'archived': return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-bold uppercase">Archived</span>;
      default: return <span className="px-2 py-1 bg-muted/50 rounded-md text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground mt-1">Review products, manage content, and enforce platform rules.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
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
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft / Pending</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
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
               <p>No products currently require moderation.</p>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Product / Seller</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Moderation Actions</th>
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
                            <p className="text-xs text-muted-foreground mt-0.5" title={p.seller?.name}>Seller: {p.seller?.name}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {p.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.status !== 'published' && (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'published')}
                              className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-md transition-colors"
                              title="Approve / Publish"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          {p.status !== 'archived' && (
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'archived')}
                              className="p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-md transition-colors"
                              title="Archive / Hide"
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                            title="Force Delete"
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
            <span className="text-sm text-muted-foreground">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.current_page <= 1}
                onClick={() => fetchProducts(pagination.current_page - 1)}
                className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchProducts(pagination.current_page + 1)}
                className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
