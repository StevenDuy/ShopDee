"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { 
  Package, Search, Filter, Ban, Eye, MessageCircle, 
  Trash2, X, Store, User as UserIcon, AlertTriangle, Edit,
  ShieldAlert, CheckCircle2, ShoppingBag, ArrowUpRight,
  Mail, Phone, Calendar, AlertCircle, UserCheck
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CategoryManager from "./CategoryManager";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  // Seller detail state
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);


  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchProducts = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/products`, {
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
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [token, statusFilter, search]);

  const viewProductDetails = async (p: any) => {
    if (!token) return;
    if (p.deleted_at) {
        alert(t("admin_products.deleted_warning") || "Sản phẩm này đã bị xóa bởi người bán. Không thể xem chi tiết.");
        return;
    }
    try {
        const res = await axios.get(`${API}/admin/products/${p.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedProduct(res.data);
        setShowDetail(true);
    } catch (err) {
        console.error("Failed to fetch product details", err);
    }
  };

  const handleBanProduct = async () => {
    if (!token || !selectedProduct || !banReason) return;
    try {
        setIsBanning(true);
        await axios.put(`${API}/admin/products/${selectedProduct.id}/ban`, 
            { reason: banReason },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setShowBanModal(false);
        setBanReason("");
        fetchProducts(pagination.current_page);
        setSelectedProduct({ ...selectedProduct, status: 'banned', ban_reason: banReason });
    } catch (err) {
        console.error("Failed to ban product", err);
        alert(t("admin_products.ban_error") || "Lỗi khi cấm sản phẩm.");
    } finally {
        setIsBanning(false);
    }
  };

  const handleUnbanProduct = async () => {
    if (!token || !selectedProduct) return;
    try {
        setIsBanning(true);
        await axios.put(`${API}/admin/products/${selectedProduct.id}/unban`, 
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchProducts(pagination.current_page);
        setSelectedProduct({ ...selectedProduct, status: 'active', ban_reason: null });
    } catch (err) {
        console.error("Failed to unban product", err);
        alert("Lỗi khi mở khóa sản phẩm.");
    } finally {
        setIsBanning(false);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!token) return;
    const isTrashed = !!product.deleted_at;
    const msg = isTrashed 
        ? (t("admin_products.confirm_restore") || "Bạn có muốn khôi phục sản phẩm này?")
        : (t("admin_products.confirm_delete") || "Bạn có chắc chắn muốn xóa sản phẩm này?");
    
    if (!confirm(msg)) return;
    
    try {
        await axios.delete(`${API}/admin/products/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts(pagination.current_page);
    } catch (err) {
        console.error("Failed to toggle product deletion", err);
        alert(t("admin_products.delete_error") || "Lỗi khi xử lý xóa/khôi phục sản phẩm.");
    }
  };

  const viewSellerDetails = async (id: number) => {
    try {
        setLoadingSeller(true);
        setShowSellerModal(true);
        const res = await axios.get(`${API}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedSeller(res.data);
    } catch (err) {
        console.error("Failed to fetch seller details", err);
    } finally {
        setLoadingSeller(false);
    }
  };

  const handleBanUser = async (u: any) => {
    if (!token) return;
    const reason = prompt(t("admin_products.ban_reason_placeholder") || "Lý do cấm người dùng này?");
    if (!reason) return;
    try {
      await axios.put(`${API}/admin/users/${u.id}/ban`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      viewSellerDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể cấm người dùng");
    }
  };

  const handleUnbanUser = async (u: any) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn bỏ cấm người dùng này?")) return;
    try {
      await axios.put(`${API}/admin/users/${u.id}/unban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      viewSellerDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể bỏ cấm người dùng");
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!token) return;
    if (!confirm(t("admin.users_manage.confirm_delete", { name: u.name }) || `Bạn có chắc chắn muốn xóa người dùng ${u.name}?`)) {
      return;
    }
    try {
      await axios.delete(`${API}/admin/users/${u.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSellerModal(false);
      fetchProducts(pagination.current_page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa người dùng");
    }
  };

  const fetchReviews = async (id: number) => {
    try {
        setLoadingReviews(true);
        const res = await axios.get(`${API}/products/${id}/reviews`);
        setReviews(res.data.data.data);
    } catch (err) {
        console.error("Failed to fetch reviews", err);
    } finally {
        setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (showDetail && selectedProduct) {
        fetchReviews(selectedProduct.id);
    }
  }, [showDetail, selectedProduct]);

  const statusBadge = (status: string) => {
    switch (status) {
        case 'active': return "bg-green-500/10 text-green-600 border-green-500/20";
        case 'banned': return "bg-red-500/10 text-red-600 border-red-500/20";
        case 'draft': return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 bg-background max-w-7xl mx-auto overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center border-b-4 md:border-b-8 border-primary pb-6 md:pb-8 gap-4">
        <div className="px-2 text-wrap">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight">{t("admin.products_view")}</h1>
          <p className="text-muted-foreground font-bold text-[10px] md:text-xs uppercase opacity-60 tracking-[0.2em] mt-2 md:mt-3 px-4">{t("admin_products.desc")}</p>
        </div>
        <div className="bg-primary/5 px-6 md:px-8 py-3 md:py-4 border-2 border-primary/20 flex flex-col items-center">
            <p className="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-widest mb-0.5 md:1">{t("admin.total_products")}</p>
            <p className="text-xl md:text-2xl font-black">{pagination.total}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-card border-2 border-border p-4">
          <div className="md:col-span-5 lg:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all" size={20} />
              <input 
                  type="text" 
                  placeholder={t("products_page.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:border-primary focus:bg-background outline-none font-bold text-sm transition-all"
              />
          </div>
          <div className="md:col-span-3 lg:col-span-3">
              <button 
                  onClick={() => setShowCategoryManager(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:opacity-90 active:scale-95 transition-all border-2 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none"
              >
                  <Package size={18} />
                  {t("admin.banners.categories.title").toUpperCase()}
              </button>
          </div>
          <div className="md:col-span-4 lg:col-span-3 flex items-center gap-2 text-wrap w-full">
              <Filter size={20} className="text-muted-foreground ml-2 shrink-0" />
              <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 w-full bg-muted/30 border-2 border-transparent focus:border-primary px-4 py-3 outline-none font-black uppercase text-xs tracking-widest cursor-pointer transition-all truncate"
              >
                  <option value="all">{t("admin_products.all_status")}</option>
                  <option value="active">{t("seller.products_manage.active").toUpperCase()}</option>
                  <option value="hide">{t("seller.products_manage.hide").toUpperCase()}</option>
                  <option value="out_of_stock">{t("seller.products_manage.out_of_stock").toUpperCase()}</option>
                  <option value="banned">{t("admin_products.product_banned").toUpperCase()}</option>
              </select>
          </div>
      </div>

      {/* Seller-style Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                        <th className="px-4 md:px-6 py-4 font-semibold uppercase tracking-wider text-[10px] md:text-[11px]">{t("admin_products.product_seller")}</th>
                        <th className="hidden sm:table-cell px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">{t("seller.products_manage.category")}</th>
                        <th className="px-4 md:px-6 py-4 font-semibold uppercase tracking-wider text-[10px] md:text-[11px]">{t("seller.products_manage.price")}</th>
                        <th className="px-4 md:px-6 py-4 font-semibold uppercase tracking-wider text-[10px] md:text-[11px]">{t("seller.products_manage.status")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {loading ? (
                        <tr><td colSpan={4} className="px-6 py-20 text-center"><div className="w-8 h-8 bg-muted animate-pulse rounded-full" /><p className="text-[10px] font-bold uppercase opacity-40">{t("loading")}</p></td></tr>
                    ) : products.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-20 text-center text-muted-foreground"><Package size={40} className="mx-auto mb-3 opacity-20" /><p className="text-xs font-bold uppercase">{t("admin.no_recent_products") || "Không có sản phẩm nào"}</p></td></tr>
                    ) : products.map((p) => (
                        <tr key={p.id} className={`hover:bg-muted/40 transition-colors group cursor-pointer ${p.deleted_at ? 'opacity-50' : ''}`} onClick={() => viewProductDetails(p)}>
                            <td className="px-4 md:px-6 py-4 font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
                                        {p.media?.[0]?.full_url ? (
                                            <img src={p.media[0].full_url} className="w-full h-full object-cover" alt={p.title} />
                                        ) : (
                                            <ShoppingBag className="opacity-10" size={20} />
                                        )}
                                        {p.deleted_at && (
                                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                <Trash2 size={16} className="text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-xs md:text-sm truncate max-w-[120px] md:max-w-[250px] group-hover:text-primary transition-colors uppercase tracking-tight">{p.title}</p>
                                        <div className="flex items-center justify-between mt-2 gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="w-5 h-5 bg-muted border border-border rounded-full flex items-center justify-center text-[8px] font-bold shrink-0">
                                                    {p.seller?.name?.charAt(0)}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium truncate opacity-60">{p.seller?.name}</span>
                                            </div>
                                            <Link 
                                                href={`/admin/inbox?userId=${p.seller_id}`} 
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2 md:px-3 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-500/20 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
                                            >
                                                {t("seller.inbox.chat_now")}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4">
                                <span className="bg-muted px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {p.category?.name || "N/A"}
                                </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 font-bold text-primary text-xs md:text-sm">
                                {formatPrice(p.price)}
                            </td>
                            <td className="px-4 md:px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    {p.deleted_at ? (
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-600 border border-red-500/20 italic">{t("common.deleted")}</span>
                                    ) : p.status === 'active' ? (
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{t("seller.products_manage.active")}</span>
                                    ) : p.status === 'hide' ? (
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 border border-amber-500/20">{t("seller.products_manage.hide")}</span>
                                    ) : p.status === 'out_of_stock' ? (
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-500/10 text-gray-600 border border-gray-500/20 uppercase tracking-widest">{t("seller.products_manage.out_of_stock")}</span>
                                    ) : p.status === 'banned' ? (
                                        <>
                                            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-600 border border-red-500/20">{t("admin_products.product_banned", { defaultValue: "BỊ CẤM" })}</span>
                                            {p.ban_reason && <p className="text-[9px] text-red-500/70 font-medium italic truncate max-w-[120px]" title={p.ban_reason}>{p.ban_reason}</p>}
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground border border-border capitalize">{p.status}</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && pagination.last_page > 1 && (
            <div className="p-4 border-t border-border flex justify-center gap-2 bg-muted/20">
                {[...Array(pagination.last_page)].map((_, i) => (
                    <button 
                        key={i} 
                        onClick={() => fetchProducts(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.current_page === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-card hover:bg-muted"}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
          )}
      </div>

      {/* Product Detail Modal (Customer Style) */}
      <AnimatePresence>
        {showDetail && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
               {/* Modal Header */}
               <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("admin_products.product_detail")}</span>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-4 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 md:gap-10 items-start">
                        {/* Gallery Mockup */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-white border-2 border-primary/10 rounded-2xl flex items-center justify-center p-8 relative overflow-hidden group">
                                <img src={selectedProduct.media?.[0]?.full_url || "https://picsum.photos/600"} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={selectedProduct.title} />
                                {selectedProduct.status === 'banned' && (
                                    <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[2px] flex items-center justify-center">
                                         <Ban size={120} className="text-red-600/30 -rotate-12" />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {selectedProduct.media?.map((m: any, i: number) => (
                                    <div key={i} className="w-16 h-16 md:w-20 md:h-20 border-2 border-border rounded-xl overflow-hidden shrink-0 opacity-70 hover:opacity-100 transition-all cursor-pointer">
                                        <img src={m.full_url} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest">{selectedProduct.category?.name}</p>
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">{selectedProduct.title}</h1>
                                
                                <div className="flex items-center gap-4 py-2">
                                     <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusBadge(selectedProduct.status)}`}>
                                        {t(`common.${selectedProduct.status}`).toUpperCase()}
                                     </div>
                                     <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">ITEM ID: {selectedProduct.id}</span>
                                </div>
                            </div>

                            <div className="bg-primary/5 border border-primary/10 p-4 md:p-6 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">{t("seller.products_manage.price")}</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">
                                        {formatPrice(selectedProduct.price)}
                                    </span>
                                    {selectedProduct.sale_price && (
                                         <span className="text-sm text-muted-foreground line-through">{formatPrice(selectedProduct.sale_price)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Seller Card (Clickable) */}
                            <div 
                                onClick={() => viewSellerDetails(selectedProduct.seller_id)}
                                className="p-4 border border-border rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black uppercase group-hover:scale-110 transition-transform text-xl shadow-sm">
                                        {selectedProduct.seller?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase leading-tight mb-0.5">{t("admin_products.product_seller")}</p>
                                        <p className="text-sm font-black uppercase group-hover:text-primary transition-colors underline underline-offset-4 decoration-dotted">{selectedProduct.seller?.name}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-1">
                                    <Link 
                                        href={`/admin/inbox?userId=${selectedProduct.seller_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full sm:w-auto text-center px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:scale-105 active:scale-95"
                                    >
                                        {t("seller.inbox.chat_now")}
                                    </Link>
                                </div>
                            </div>

                            {selectedProduct.status === 'banned' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-1.5 overflow-hidden">
                                     <div className="flex items-center gap-2 text-red-600">
                                        <ShieldAlert size={16} />
                                        <p className="text-[10px] font-black uppercase tracking-wider">{t("admin_products.banned_status_msg")}</p>
                                     </div>
                                     <p className="text-sm font-bold text-red-600/80 italic leading-relaxed text-wrap">"{selectedProduct.ban_reason}"</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="p-4 bg-muted/30 rounded-2xl text-wrap">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">{t("seller.products_manage.inventory")}</p>
                                    <p className="text-xl font-black">{selectedProduct.stock_quantity}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-2xl text-wrap">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">{t("common.sold")}</p>
                                    <p className="text-xl font-black">{selectedProduct.sold_count || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="mt-12 space-y-10">
                        <section className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="h-4 w-1 bg-primary rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("product_details.description")}</h3>
                             </div>
                             <div className="p-4 md:p-8 bg-muted/20 rounded-3xl text-[13px] md:text-sm font-medium leading-relaxed uppercase opacity-70 whitespace-pre-wrap max-w-4xl text-wrap overflow-hidden">
                                {selectedProduct.description || t("common.no_data")}
                             </div>
                        </section>

                        <section className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="h-4 w-1 bg-primary rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("product_details.specifications")}</h3>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedProduct.attributes?.map((attr: any) => (
                                    <div key={attr.id} className="flex gap-4 p-4 border border-border rounded-xl items-center text-wrap overflow-hidden">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase w-24 shrink-0">{attr.attribute_name}</div>
                                        <div className="text-[11px] font-bold uppercase truncate">{attr.attribute_value}</div>
                                    </div>
                                ))}
                             </div>
                        </section>

                        {/* Reviews Section */}
                        <section className="space-y-6">
                             <div className="flex items-center gap-3">
                                <div className="h-4 w-1 bg-amber-500 rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("product_details.reviews")}</h3>
                             </div>
                             
                             {loadingReviews ? (
                               <div className="p-10 text-center"><div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                             ) : reviews.length === 0 ? (
                                <div className="p-10 border-2 border-dashed border-border text-center opacity-30 rounded-3xl">
                                    <p className="text-xs font-black uppercase tracking-widest text-wrap">{t("product_details.no_reviews")}</p>
                                </div>
                             ) : (
                               <div className="space-y-4">
                                   {reviews.map((rev: any) => (
                                       <div key={rev.id} className="p-6 bg-muted/20 border border-border rounded-3xl space-y-3">
                                           <div className="flex justify-between items-start">
                                               <div className="flex items-center gap-3">
                                                   <div className="w-8 h-8 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center font-black text-[10px] uppercase shrink-0">
                                                       {rev.customer?.name?.charAt(0)}
                                                   </div>
                                                   <div className="min-w-0">
                                                       <p className="text-xs font-black uppercase text-wrap truncate">{rev.customer?.name}</p>
                                                       <p className="text-[10px] text-muted-foreground">{rev.created_at}</p>
                                                   </div>
                                               </div>
                                               <div className="flex items-center gap-0.5 shrink-0">
                                                   {[...Array(5)].map((_, i) => (
                                                       <div key={i} className={`w-2 h-2 rounded-full ${i < rev.rating ? 'bg-amber-500' : 'bg-muted'}`} />
                                                   ))}
                                               </div>
                                           </div>
                                           <p className="text-[13px] md:text-sm font-medium leading-relaxed opacity-80 text-wrap overflow-hidden">{rev.comment}</p>
                                       </div>
                                   ))}
                               </div>
                             )}
                        </section>
                    </div>
                  </div>
               </div>

               {/* Action Footer */}
                <div className="p-4 md:p-8 border-t border-border bg-muted/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                        {selectedProduct.status !== 'banned' ? (
                            <button 
                                onClick={() => setShowBanModal(true)}
                                className="px-10 py-3.5 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Ban size={18} strokeWidth={3} />
                                {t("admin_products.ban_product")}
                            </button>
                        ) : (
                            <button 
                                onClick={handleUnbanProduct}
                                className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} strokeWidth={3} />
                                {t("admin_products.unban_product") || "UNBAN PRODUCT"}
                            </button>
                        )}
 
                        {!selectedProduct.deleted_at ? (
                            <button 
                                onClick={() => {
                                    if (confirm(t("confirm_delete"))) {
                                        axios.delete(`${API}/admin/products/${selectedProduct.id}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        }).then(() => {
                                            fetchProducts(pagination.current_page);
                                            setShowDetail(false);
                                        });
                                    }
                                }}
                                className="px-8 py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                {t("admin.delete")}
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    if (confirm(t("admin_products.confirm_restore") || "Bạn có muốn khôi phục sản phẩm này?")) {
                                        axios.delete(`${API}/admin/products/${selectedProduct.id}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        }).then(() => {
                                            fetchProducts(pagination.current_page);
                                            setShowDetail(false);
                                        });
                                    }
                                }}
                                className="px-8 py-3.5 border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight size={18} />
                                {t("admin_products.restore_product") || "KHÔI PHỤC"}
                            </button>
                        )}
                    </div>
                   
                   <button 
                       onClick={() => setShowDetail(false)} 
                       className="px-10 py-3.5 bg-muted text-muted-foreground hover:bg-card border-2 border-border rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all text-center"
                   >
                        {t("profile_page.cancel")}
                   </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seller Info Modal (Admin User Modal Style) */}
      <AnimatePresence>
        {showSellerModal && selectedSeller && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSellerModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm shadow-[inset_0px_0px_100px_rgba(0,0,0,0.2)]" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-card border-4 border-border shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Modal Header */}
                    <div className="p-4 md:p-6 border-b-4 border-border bg-muted flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <div className="w-16 h-16 border-4 border-border bg-background flex items-center justify-center font-black text-2xl text-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                {selectedSeller.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{selectedSeller.name}</h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                    <span className={`px-2 py-0.5 border-2 font-black text-[9px] tracking-widest uppercase bg-purple-500/10 text-purple-500 border-purple-500/20`}>
                                        {t("roles.seller").toUpperCase()}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">UID: {selectedSeller.id}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowSellerModal(false)} className="self-end sm:self-auto p-2 md:p-3 border-2 border-border hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none">
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-4 md:p-8 overflow-y-auto space-y-10 custom-scrollbar">
                        {loadingSeller ? (
                            <div className="py-20 text-center"><div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Information Columns */}
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-primary" />
                                            {t("admin.users_manage.customer_info")}
                                        </p>
                                        <div className="space-y-4 text-wrap">
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                                    <Mail size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black opacity-40 uppercase">{t("profile_page.email")}</p>
                                                    <p className="font-bold truncate">{selectedSeller.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                                    <Phone size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black opacity-40 uppercase">{t("profile_page.phone")}</p>
                                                    <p className="font-bold">{selectedSeller.profile?.phone || t("common.no_data")}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 border-2 border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                                    <Calendar size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black opacity-40 uppercase">{t("admin.joined")}</p>
                                                    <p className="font-bold">
                                                        {selectedSeller.created_at ? format(new Date(selectedSeller.created_at), "eeee, dd/MM/yyyy", { locale: i18n.language === 'vi' ? vi : undefined }) : t("common.no_data")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses Column */}
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                                        <AlertCircle size={12} className="text-blue-500" />
                                        {t("profile_page.my_addresses")}
                                    </p>
                                    <div className="space-y-3">
                                        {selectedSeller.addresses?.length > 0 ? selectedSeller.addresses.map((addr: any) => (
                                            <div key={addr.id} className="p-4 border-2 border-border bg-muted/20 relative group overflow-hidden text-wrap">
                                                <div className="absolute top-0 right-0 p-1.5 bg-border text-[8px] font-black uppercase text-white tracking-widest">{addr.type}</div>
                                                <p className="text-sm font-bold truncate pr-10">{addr.address_line_1}</p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{addr.city}, {addr.country}</p>
                                                {addr.is_default && (
                                                    <div className="mt-2 inline-block px-2 py-0.5 border border-primary text-[8px] font-black uppercase text-primary tracking-tighter">{t("profile_page.default")}</div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="p-10 border-2 border-dashed border-border text-center opacity-40">
                                                <p className="text-xs font-black uppercase">{t("profile_page.no_addresses")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer Actions */}
                    {!loadingSeller && (
                        <div className="p-4 md:p-8 border-t-4 border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                <Link 
                                    href={`/admin/inbox?userId=${selectedSeller.id}`}
                                    className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                >
                                    <MessageCircle size={18} />
                                    {t("admin.users_manage.chat_with_user")}
                                </Link>
                                <button 
                                    onClick={() => selectedSeller.status === 'banned' ? handleUnbanUser(selectedSeller) : handleBanUser(selectedSeller)}
                                    className={`flex items-center justify-center gap-3 ${selectedSeller.status === 'banned' ? 'bg-green-600 shadow-[6px_6px_0px_0px_rgba(22,163,74,0.2)]' : 'bg-slate-900 shadow-[6px_6px_0px_0px_rgba(30,41,59,0.2)]'} text-white px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest active:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all`}
                                >
                                    {selectedSeller.status === 'banned' ? <UserCheck size={18} /> : <Ban size={18} />}
                                    {selectedSeller.status === 'banned' ? t("admin.users_manage.unban_user") : t("admin.users_manage.ban_user")}
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => handleDeleteUser(selectedSeller)}
                                className="flex items-center justify-center gap-3 border-2 border-red-500 text-red-500 px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(239,68,68,0.1)]"
                            >
                                <Trash2 size={18} />
                                {t("admin.users_manage.delete_user")}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        )}
      </AnimatePresence>
 
      {/* Ban Reason Modal */}
      <AnimatePresence>
        {showBanModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBanModal(false)} className="absolute inset-0 bg-red-900/40 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-card border-4 border-red-500 shadow-[12px_12px_0px_0px_rgba(239,68,68,0.2)] p-6 md:p-8 space-y-6 overflow-hidden">
                    <div className="flex items-center gap-3 text-red-500">
                        <ShieldAlert size={32} className="shrink-0" />
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t("admin_products.ban_product")}</h2>
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase leading-relaxed text-wrap">{t("admin_products.confirm_ban")}</p>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t("admin_products.ban_reason")}</label>
                        <textarea 
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder={t("admin_products.ban_reason_placeholder")}
                            className="w-full h-32 p-4 bg-muted/50 border-2 border-border focus:border-red-500 outline-none font-bold text-sm resize-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleBanProduct}
                            disabled={isBanning || !banReason}
                            className="flex-1 bg-red-600 text-white py-4 font-black uppercase text-xs tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none order-2 sm:order-1"
                        >
                            {isBanning ? t("loading") : t("admin_products.confirm_ban_btn")}
                        </button>
                        <button onClick={() => setShowBanModal(false)} className="px-6 py-4 border-2 border-border font-black uppercase text-xs tracking-widest hover:bg-muted transition-all order-1 sm:order-2">
                            {t("profile_page.cancel")}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <CategoryManager 
        isOpen={showCategoryManager} 
        onClose={() => setShowCategoryManager(false)} 
        token={token} 
        api={API} 
      />


      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-left: 2px solid #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; }
      `}</style>
    </div>
  );
}





