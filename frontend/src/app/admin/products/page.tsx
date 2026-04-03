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
  Mail, Phone, Calendar, AlertCircle, UserCheck, ChevronLeft, ChevronRight,
  TrendingUp
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

import Link from "next/link";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CategoryManager from "./CategoryManager";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


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
      alert(t("admin_products.deleted_warning"));
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
      alert(t("admin_products.ban_error"));
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
      alert(t("admin_products.unban_error"));
    } finally {
      setIsBanning(false);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!token) return;
    const isTrashed = !!product.deleted_at;
    const msg = isTrashed
      ? t("admin_products.confirm_restore")
      : t("admin_products.confirm_delete");

    if (!confirm(msg)) return;

    try {
      await axios.delete(`${API}/admin/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts(pagination.current_page);
    } catch (err) {
      console.error("Failed to toggle product deletion", err);
      alert(t("admin_products.delete_error"));
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
    const reason = prompt(t("admin_products.ban_reason_placeholder"));
    if (!reason) return;
    try {
      await axios.put(`${API}/admin/users/${u.id}/ban`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      viewSellerDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin_products.ban_user_error"));
    }
  };

  const handleUnbanUser = async (u: any) => {
    if (!token) return;
    if (!confirm(t("admin_products.confirm_unban_user"))) return;
    try {
      await axios.put(`${API}/admin/users/${u.id}/unban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      viewSellerDetails(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin_products.unban_user_error"));
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!token) return;
    if (!confirm(t("admin.users_manage.confirm_delete", { name: u.name }))) {
      return;
    }
    try {
      await axios.delete(`${API}/admin/users/${u.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSellerModal(false);
      fetchProducts(pagination.current_page);
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin_products.delete_user_error"));
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

  const RenderStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">{t("seller.products_manage.active")}</Badge>;
      case 'banned':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">{t("admin_products.product_banned")}</Badge>;
      case 'hide':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">{t("seller.products_manage.hide")}</Badge>;
      case 'out_of_stock':
        return <Badge variant="secondary" className="uppercase tracking-widest">{t("seller.products_manage.out_of_stock")}</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 bg-background max-w-7xl mx-auto overflow-hidden">

      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center border-b border-border/50 pb-8 md:pb-12 gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{t("admin.products_view")}</h1>
          <p className="text-muted-foreground font-bold text-[10px] md:text-xs uppercase opacity-70 tracking-widest">{t("admin_products.desc")}</p>
        </div>
        <Card className="bg-muted/50 px-8 py-4 border-border/50 flex flex-col items-center rounded-3xl">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{t("admin.total_products")}</p>
          <p className="text-2xl md:text-3xl font-black tracking-tighter">{pagination.total}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4 border-border/50 shadow-sm rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 lg:col-span-6 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <Input
              type="text"
              placeholder={t("products_page.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-muted/30 border-transparent focus:border-primary focus:bg-background rounded-2xl font-bold transition-all"
            />
          </div>
          <div className="md:col-span-3 lg:col-span-3">
            <Button
              onClick={() => setShowCategoryManager(true)}
              className="w-full h-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Package size={18} className="mr-2" />
              {t("admin.banners.categories.title")}
            </Button>
          </div>
          <div className="md:col-span-4 lg:col-span-3 flex items-center gap-2">
            <Filter size={20} className="text-muted-foreground ml-2 shrink-0 opacity-50" />
            <Select value={statusFilter} onValueChange={(v: unknown) => setStatusFilter(v as string)}>
                <SelectTrigger className="h-12 bg-muted/30 border-transparent focus:border-primary rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                  <SelectValue>
                    {statusFilter === "all" ? t("admin_products.all_status") : 
                     statusFilter === "active" ? t("seller.products_manage.active") : 
                     statusFilter === "hide" ? t("seller.products_manage.hide") : 
                     statusFilter === "out_of_stock" ? t("seller.products_manage.out_of_stock") : 
                     statusFilter === "banned" ? t("admin_products.product_banned") : 
                     t("admin_products.all_status")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl">
                  <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("admin_products.all_status")}
                  </SelectItem>
                  <SelectItem value="active" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("seller.products_manage.active")}
                  </SelectItem>
                  <SelectItem value="hide" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("seller.products_manage.hide")}
                  </SelectItem>
                  <SelectItem value="out_of_stock" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("seller.products_manage.out_of_stock")}
                  </SelectItem>
                  <SelectItem value="banned" className="font-bold uppercase text-[10px] tracking-widest leading-none py-3">
                    {t("admin_products.product_banned")}
                  </SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Product Table */}
      <Card className="border-border/50 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground font-black border-b border-border/50">
              <tr>
                <th className="px-6 py-5 uppercase tracking-widest text-[10px]">{t("admin_products.product_seller")}</th>
                <th className="hidden sm:table-cell px-6 py-5 uppercase tracking-widest text-[10px]">{t("seller.products_manage.category")}</th>
                <th className="px-6 py-5 uppercase tracking-widest text-[10px]">{t("seller.products_manage.price")}</th>
                <th className="px-6 py-5 uppercase tracking-widest text-[10px] text-right">{t("seller.products_manage.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-32 text-center opacity-30 select-none"><Package size={64} className="mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[0.2em]">{t("admin.no_recent_products")}</p></td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className={cn("hover:bg-muted/40 transition-colors group cursor-pointer", p.deleted_at && "opacity-50 grayscale-[0.5]")} onClick={() => viewProductDetails(p)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-muted rounded-2xl border border-border/50 flex items-center justify-center overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                        {p.media?.[0]?.full_url ? (
                          <img src={p.media[0].full_url} className="w-full h-full object-cover" alt={p.title} />
                        ) : (
                          <ShoppingBag className="opacity-10" size={24} />
                        )}
                        {p.deleted_at && (
                          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                            <Trash2 size={20} className="text-destructive shadow-sm" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm md:text-base truncate max-w-[250px] group-hover:text-primary transition-colors uppercase tracking-tight leading-tight">{p.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                           <div className="flex items-center gap-2 group/nick overflow-hidden">
                              <span className="text-primary font-black opacity-40 px-1 border border-primary/20 rounded text-[8px] tracking-widest shrink-0">S</span> 
                              <span className="truncate max-w-[120px] text-[10px] font-bold text-muted-foreground uppercase opacity-70 group-hover/nick:opacity-100 transition-all">{p.seller?.name}</span>
                           </div>
                           <Button
                              asChild
                              variant="ghost"
                              size="xs"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border-transparent uppercase tracking-widest text-[8px]"
                           >
                            <Link href={`/admin/inbox?userId=${p.seller_id}`}>{t("seller.inbox.chat_now")}</Link>
                           </Button>
                        </div>
                      </div>
                    </div>
                  </td>
                      <td className="hidden sm:table-cell px-6 py-5">
                    <Badge variant="outline" className="bg-muted px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-muted-foreground border-border/50">
                      {p.category?.name || t("common.no_data")}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 font-black text-primary text-sm md:text-base tracking-tighter">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {p.deleted_at ? (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 italic text-[9px] font-black">{t("common.deleted")}</Badge>
                      ) : (
                        <RenderStatusBadge status={p.status} />
                      )}
                      {p.status === 'banned' && p.ban_reason && (
                        <p className="text-[9px] text-destructive/70 font-bold italic truncate max-w-[150px] mt-1" title={p.ban_reason}>"{p.ban_reason}"</p>
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
          <div className="p-6 border-t border-border/50 flex justify-center gap-2 bg-muted/20">
             <Button
                variant="outline"
                size="icon"
                disabled={pagination.current_page === 1}
                onClick={() => fetchProducts(pagination.current_page - 1)}
                className="rounded-xl border-border/50"
             >
                <ChevronLeft size={16} />
             </Button>
            {[...Array(pagination.last_page)].map((_, i) => (
              <Button
                key={i}
                variant={pagination.current_page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => fetchProducts(i + 1)}
                className={cn("w-10 h-10 rounded-xl font-black text-xs", pagination.current_page === i + 1 && "shadow-lg shadow-primary/20")}
              >
                {i + 1}
              </Button>
            ))}
            <Button
                variant="outline"
                size="icon"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchProducts(pagination.current_page + 1)}
                className="rounded-xl border-border/50"
             >
                <ChevronRight size={16} />
             </Button>
          </div>
        )}
      </Card>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)} className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-5xl bg-card border border-border/50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-border/50 bg-muted/40 flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t("admin_products.product_detail")}</p>
                    <h2 className="text-xl font-black uppercase tracking-tight truncate max-w-md">{selectedProduct.title}</h2>
                 </div>
                 <Button variant="ghost" size="icon-lg" onClick={() => setShowDetail(false)} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                    <X size={24} />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 items-start">
                    {/* Gallery Section */}
                    <div className="space-y-6">
                      <Card className="aspect-square bg-white border-border/50 rounded-[2.5rem] flex items-center justify-center p-12 relative overflow-hidden group shadow-xl shadow-primary/5">
                        <img src={selectedProduct.media?.[0]?.full_url || "https://picsum.photos/600"} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" alt={selectedProduct.title} />
                        {selectedProduct.status === 'banned' && (
                          <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[4px] flex items-center justify-center">
                             <div className="text-center space-y-2 -rotate-12">
                                <Ban size={120} className="text-destructive/20 mx-auto" strokeWidth={3} />
                                <p className="font-black text-destructive uppercase tracking-[0.5em] text-sm">BANNED</p>
                             </div>
                          </div>
                        )}
                      </Card>
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {selectedProduct.media?.map((m: any, i: number) => (
                          <div key={i} className="w-20 h-20 border border-border/50 rounded-2xl overflow-hidden shrink-0 opacity-40 hover:opacity-100 hover:scale-105 transition-all cursor-pointer bg-white p-2">
                            <img src={m.full_url} className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <Badge className="bg-primary/5 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black px-4 py-1">{selectedProduct.category?.name}</Badge>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[0.9]">{selectedProduct.title}</h1>

                        <div className="flex items-center gap-6 pt-4">
                           <RenderStatusBadge status={selectedProduct.status} />
                           <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">{t("admin_products.id_prefix")} {selectedProduct.id}</span>
                        </div>
                      </div>

                      <Card className="bg-primary/5 border-primary/10 p-8 rounded-[2rem]">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 opacity-50">{t("seller.products_manage.price")}</p>
                        <div className="flex items-baseline gap-4">
                          <span className="text-4xl md:text-6xl font-black text-primary tracking-tighter">
                            {formatPrice(selectedProduct.price)}
                          </span>
                          {selectedProduct.sale_price && (
                            <span className="text-xl text-muted-foreground line-through opacity-30 font-bold">{formatPrice(selectedProduct.sale_price)}</span>
                          )}
                        </div>
                      </Card>

                      {/* Seller Info Card */}
                      <Card
                        onClick={() => viewSellerDetails(selectedProduct.seller_id)}
                        className="p-6 border-border/50 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer shadow-lg shadow-primary/[0.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl uppercase group-hover:scale-110 transition-transform">
                            {selectedProduct.seller?.name?.charAt(0)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">{t("admin_products.product_seller")}</p>
                            <p className="text-xl font-black uppercase tracking-tight underline-offset-8 group-hover:text-primary transition-colors">{selectedProduct.seller?.name}</p>
                          </div>
                        </div>
                        <Button
                            asChild
                            size="lg"
                            className="bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-blue-500/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Link href={`/admin/inbox?userId=${selectedProduct.seller_id}`}>
                                {t("seller.inbox.chat_now")}
                            </Link>
                        </Button>
                      </Card>

                      {selectedProduct.status === 'banned' && (
                        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-[2rem] space-y-3 relative overflow-hidden">
                           <ShieldAlert className="absolute -right-4 -bottom-4 size-24 opacity-5" />
                           <div className="flex items-center gap-3 text-destructive">
                             <ShieldAlert size={20} strokeWidth={3} />
                             <p className="text-[11px] font-black uppercase tracking-widest">{t("admin_products.banned_status_msg")}</p>
                           </div>
                           <p className="text-base font-bold text-destructive/80 italic leading-relaxed">"{selectedProduct.ban_reason}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-6">
                        <Card className="p-6 bg-muted/30 border-border/50 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mb-1">{t("seller.products_manage.inventory")}</p>
                          <p className="text-3xl font-black tracking-tight">{selectedProduct.stock_quantity}</p>
                        </Card>
                        <Card className="p-6 bg-muted/30 border-border/50 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest mb-1">{t("common.sold")}</p>
                          <p className="text-3xl font-black tracking-tight">{selectedProduct.sold_count || 0}</p>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div className="mt-20 space-y-20">
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-6 w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,77,0,0.5)]" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t("product_details.description")}</h3>
                      </div>
                      <Card className="p-10 bg-muted/10 border-border/50 rounded-[2.5rem] text-base md:text-lg font-bold text-foreground/70 leading-relaxed uppercase tracking-tight whitespace-pre-wrap max-w-4xl opacity-80">
                        {selectedProduct.description || t("common.no_data")}
                      </Card>
                    </section>

                    <section className="space-y-6">
                       <div className="flex items-center gap-4">
                        <div className="h-6 w-1.5 bg-blue-500 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t("product_details.specifications")}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProduct.attributes?.map((attr: any) => (
                           <Card key={attr.id} className="flex gap-6 p-6 border-border/50 rounded-2xl items-center hover:border-primary/30 transition-all group">
                             <div className="text-[10px] font-black text-muted-foreground uppercase w-28 shrink-0 tracking-widest opacity-40 group-hover:opacity-100 transition-all">{attr.attribute_name}</div>
                             <div className="text-xs font-black uppercase tracking-tight flex-1">{attr.attribute_value}</div>
                           </Card>
                        ))}
                      </div>
                    </section>

                    {/* Reviews */}
                    <section className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="h-6 w-1.5 bg-amber-500 rounded-full" />
                           <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t("product_details.reviews")}</h3>
                         </div>
                         {reviews.length > 0 && (
                            <div className="flex items-center gap-2">
                               <TrendingUp size={16} className="text-emerald-500" />
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Community</span>
                            </div>
                         )}
                      </div>

                      {loadingReviews ? (
                        <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" /></div>
                      ) : reviews.length === 0 ? (
                        <div className="py-24 border-2 border-dashed border-border/50 text-center opacity-20 select-none rounded-[3rem]">
                           <MessageCircle size={48} className="mx-auto mb-4" />
                           <p className="text-xs font-black uppercase tracking-[0.3em]">{t("admin_products.no_reviews")}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {reviews.map((rev: any) => (
                            <Card key={rev.id} className="p-8 border-border/50 rounded-[2rem] space-y-6 hover:shadow-xl hover:shadow-amber-500/[0.02] transition-all">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xs uppercase shrink-0 border border-amber-500/20 shadow-inner">
                                    {rev.customer?.name?.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-black uppercase truncate tracking-tight">{rev.customer?.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-black opacity-30 tracking-widest mt-0.5">{format(new Date(rev.created_at), 'dd/MM/yyyy')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 p-2 bg-amber-500/5 rounded-xl">
                                  {[...Array(5)].map((_, i) => (
                                    <div key={i} className={cn("w-2 h-2 rounded-full", i < rev.rating ? 'bg-amber-500' : 'bg-muted')} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm font-bold leading-relaxed opacity-70 uppercase tracking-tight">{rev.comment}</p>
                            </Card>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-12 py-8 border-t border-border/50 bg-muted/40 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  {selectedProduct.status !== 'banned' ? (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => setShowBanModal(true)}
                      className="px-12 h-14 bg-red-600 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Ban size={20} className="mr-3" strokeWidth={3} />
                      {t("admin_products.ban_product")}
                    </Button>
                  ) : (
                     <Button
                      size="lg"
                      onClick={handleUnbanProduct}
                      className="px-12 h-14 bg-emerald-600 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 size={20} className="mr-3" strokeWidth={3} />
                      {t("admin_products.unban_product")}
                    </Button>
                  )}

                  {!selectedProduct.deleted_at ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        if (confirm(t("admin_products.confirm_delete"))) {
                          axios.delete(`${API}/admin/products/${selectedProduct.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          }).then(() => {
                            fetchProducts(pagination.current_page);
                            setShowDetail(false);
                          });
                        }
                      }}
                      className="px-10 h-14 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest transition-all"
                    >
                      <Trash2 size={20} className="mr-3" />
                      {t("admin.delete")}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        if (confirm(t("admin_products.confirm_restore"))) {
                          axios.delete(`${API}/admin/products/${selectedProduct.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          }).then(() => {
                            fetchProducts(pagination.current_page);
                            setShowDetail(false);
                          });
                        }
                      }}
                      className="px-10 h-14 border-emerald-500/30 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest"
                    >
                      <ArrowUpRight size={20} className="mr-3" />
                      {t("admin_products.restore_product")}
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDetail(false)}
                  className="px-12 h-14 bg-muted/50 hover:bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-[1.25rem] transition-all"
                >
                  {t("profile_page.cancel")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seller Info Modal */}
      <AnimatePresence>
        {showSellerModal && selectedSeller && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSellerModal(false)} className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-4xl bg-card border border-border/50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-border/50 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <Card className="w-20 h-20 border-border/50 bg-background rounded-2xl flex items-center justify-center font-black text-4xl text-primary shadow-xl shadow-primary/5 shrink-0">
                    {selectedSeller.name?.charAt(0).toUpperCase()}
                  </Card>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tight">{selectedSeller.name}</h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black text-[9px] tracking-widest uppercase">
                        {t("roles.seller")}
                      </Badge>
                      <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">{t("admin_products.uid_prefix")} {selectedSeller.id}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-lg" onClick={() => setShowSellerModal(false)} className="rounded-full">
                  <X size={28} />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-10 md:p-14 overflow-y-auto space-y-14 custom-scrollbar">
                {loadingSeller ? (
                  <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
                    {/* Information Column */}
                    <div className="space-y-10">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-1.5 bg-primary rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{t("admin.users_manage.customer_info")}</h3>
                          </div>
                          <div className="space-y-4">
                            <Card className="flex items-center gap-6 p-6 border-border/50 rounded-2xl group hover:bg-muted/30 transition-all">
                              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                <Mail size={22} />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{t("profile_page.email")}</p>
                                <p className="font-bold text-base truncate">{selectedSeller.email}</p>
                              </div>
                            </Card>
                            <Card className="flex items-center gap-6 p-6 border-border/50 rounded-2xl group hover:bg-muted/30 transition-all">
                              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                <Phone size={22} />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{t("profile_page.phone")}</p>
                                <p className="font-bold text-base">{selectedSeller.profile?.phone || t("common.no_data")}</p>
                              </div>
                            </Card>
                            <Card className="flex items-center gap-6 p-6 border-border/50 rounded-2xl group hover:bg-muted/30 transition-all">
                              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                <Calendar size={22} />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{t("admin.joined")}</p>
                                <p className="font-bold text-base">
                                  {selectedSeller.created_at ? format(new Date(selectedSeller.created_at), "dd MMMM, yyyy", { locale: i18n.language === 'vi' ? vi : undefined }) : t("common.no_data")}
                                </p>
                              </div>
                            </Card>
                          </div>
                       </div>
                    </div>

                    {/* Addresses Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-1.5 bg-blue-500 rounded-full" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{t("profile_page.my_addresses")}</h3>
                        </div>
                        <div className="space-y-4">
                          {selectedSeller.addresses?.length > 0 ? selectedSeller.addresses.map((addr: any) => (
                            <Card key={addr.id} className="p-6 border-border/50 rounded-[1.5rem] relative group group-hover:bg-muted/30 transition-all overflow-hidden">
                              <Badge className="absolute top-0 right-0 rounded-bl-xl rounded-tr-none bg-muted text-[8px] font-black uppercase tracking-widest px-4 border-none">{addr.type}</Badge>
                              <p className="text-base font-black truncate pr-16 uppercase tracking-tight">{addr.address_line_1}</p>
                              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">{addr.city}, {addr.country}</p>
                              {addr.is_default && (
                                <Badge className="mt-4 bg-primary/5 text-primary border-primary/20 text-[8px] font-black tracking-widest px-3">{t("profile_page.default")}</Badge>
                              )}
                            </Card>
                          )) : (
                            <div className="py-24 border-2 border-dashed border-border/50 text-center opacity-20 select-none rounded-[2rem]">
                               <p className="text-xs font-black uppercase tracking-[0.3em]">{t("profile_page.no_addresses")}</p>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              {!loadingSeller && (
                <div className="px-10 py-8 border-t border-border/50 bg-muted/40 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Button
                      asChild
                      size="lg"
                      className="h-14 bg-blue-600 text-white px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Link href={`/admin/inbox?userId=${selectedSeller.id}`}>
                        <MessageCircle size={20} className="mr-3" />
                        {t("admin.users_manage.chat_with_user")}
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => selectedSeller.status === 'banned' ? handleUnbanUser(selectedSeller) : handleBanUser(selectedSeller)}
                      className={cn(
                        "h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95",
                        selectedSeller.status === 'banned' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-slate-950 shadow-slate-950/20"
                      )}
                    >
                      {selectedSeller.status === 'banned' ? <UserCheck size={20} className="mr-3" /> : <Ban size={20} className="mr-3" />}
                      {selectedSeller.status === 'banned' ? t("admin.users_manage.unban_user") : t("admin.users_manage.ban_user")}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleDeleteUser(selectedSeller)}
                    className="h-14 px-10 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                  >
                    <Trash2 size={20} className="mr-3" />
                    {t("admin.users_manage.delete_user")}
                  </Button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBanModal(false)} className="absolute inset-0 bg-red-950/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} className="relative w-full max-w-lg bg-card border border-red-500/20 rounded-[3.5rem] shadow-2xl p-10 md:p-14 space-y-10 overflow-hidden text-wrap">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 shadow-inner group">
                  <ShieldAlert size={48} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-red-600 leading-none">{t("admin_products.ban_product")}</h2>
                   <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest max-w-[280px] mx-auto leading-relaxed">{t("admin_products.confirm_ban")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-4">{t("admin_products.ban_reason_placeholder")}</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 focus:border-red-500 rounded-[2rem] p-8 outline-none font-bold text-sm transition-all min-h-[160px] resize-none hover:bg-muted/40"
                  placeholder="..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowBanModal(false)}
                  className="h-14 bg-muted/50 hover:bg-muted rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                >
                  {t("profile_page.cancel")}
                </Button>
                <Button
                  size="lg"
                  onClick={handleBanProduct}
                  disabled={isBanning || !banReason}
                  className="h-14 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isBanning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Ban size={18} className="mr-2" strokeWidth={3} />}
                  {t("admin_products.ban_product").toUpperCase()}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CategoryManager isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} token={token} api={API} />
    </div>
  );
}
