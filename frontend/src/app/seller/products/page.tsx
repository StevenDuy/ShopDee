"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Plus, Search, Edit, Trash2, Image as ImageIcon, 
  Eye, EyeOff, Package, ListFilter, LayoutGrid, 
  ChevronLeft, ChevronRight, BarChart3, Box
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { EditProductModal } from "@/components/seller/EditProductModal";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Product = {
  id: number;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  ban_reason?: string;
  category?: { name: string };
  media?: { url: string; full_url: string }[];
};

export default function SellerProductsPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProducts = (page = 1, query = "", status = "all") => {
    if (!token) return;
    setLoading(true);
    let url = `${API}/seller/products?page=${page}`;
    if (query) url += `&search=${query}`;
    if (status !== "all") url += `&status=${status}`;

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setProducts(res.data.data || []);
        setTotalPages(res.data.last_page || 1);
        setCurrentPage(res.data.current_page || 1);
      })
      .catch(err => console.error("Error fetching products", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts(currentPage, search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, statusFilter]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    fetchProducts(1, val, statusFilter);
  };

  const { formatPrice } = useCurrencyStore();

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* 1. ELITE HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/5 pb-10 gap-8">
           <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Package size={22} strokeWidth={2.5} />
                 </div>
                 <Badge variant="outline" className="font-black text-[9px] tracking-[0.2em] uppercase py-1 px-3 bg-background border-border/50">
                    {t("seller.products_manage.inventory_master_list")}
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                {t("seller.products")}
              </h1>
              <p className="text-muted-foreground font-bold text-[11px] uppercase opacity-60 tracking-[0.2em] mt-3">
                {t("seller.products_manage.desc")}
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Link 
                href="/seller/products/new" 
                className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 active:scale-95 transition-all")}
              >
                <Plus size={20} strokeWidth={3} className="mr-2" />
                {t("seller.products_manage.add_product")}
              </Link>
           </div>
        </div>

        {/* 2. LIVE SEARCH & QUICK STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
           <div className="lg:col-span-4 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("seller.products_manage.global_search")}</label>
              <div className="relative group">
                 <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={20} />
                 <Input
                   type="text"
                   placeholder={t("products_page.search_placeholder")}
                   value={search}
                   onChange={(e) => handleSearch(e.target.value)}
                   className="h-14 pl-16 pr-6 bg-card border-border/50 rounded-[1.5rem] font-bold text-sm shadow-sm focus-visible:bg-background focus-visible:ring-primary/10 transition-all placeholder:opacity-30 relative z-10"
                 />
              </div>
           </div>

           <div className="lg:col-span-8 flex flex-wrap lg:justify-end gap-4 pb-1">
              <QuickStat icon={Box} label={t("seller.products_manage.active_listings")} value={products.length.toString()} />
              <QuickStat icon={BarChart3} label={t("seller.products_manage.total_stock")} value={products.reduce((acc, p) => acc + p.stock_quantity, 0).toString()} />
              
              <div className="relative group h-14 min-w-[200px]">
                <ListFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60 z-20" size={18} strokeWidth={2.5} />
                <Select 
                  value={statusFilter} 
                  onValueChange={(val: any) => { setStatusFilter(val); setCurrentPage(1); }}
                >
                   <SelectTrigger className="w-full h-full pl-14 pr-10 bg-muted/20 border border-border/50 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] appearance-none focus:ring-0 focus:border-primary/50 transition-all cursor-pointer relative z-10 shadow-sm focus:bg-background">
                      <SelectValue placeholder={t("seller.products_manage.status_filter")}>
                        {statusFilter === "all" ? t("seller.products_manage.all") : undefined}
                      </SelectValue>
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl bg-card/80">
                      <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.products_manage.all")}</SelectItem>
                      <SelectItem value="active" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.products_manage.active").toUpperCase()}</SelectItem>
                      <SelectItem value="hide" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.products_manage.hide").toUpperCase()}</SelectItem>
                      <SelectItem value="out_of_stock" className="font-bold uppercase text-[10px] tracking-widest leading-none">{t("seller.products_manage.out_of_stock").toUpperCase()}</SelectItem>
                   </SelectContent>
                </Select>
              </div>
           </div>
        </div>

        {/* 3. PRODUCT GRID/TABLE (Table format for better data density) */}
        <Card className="rounded-[3rem] border-border/30 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                 <thead className="bg-muted/30 border-b border-border/30 text-muted-foreground">
                    <tr>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.products_manage.product").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black hidden sm:table-cell">{t("seller.products_manage.category").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black">{t("seller.products_manage.price").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black hidden lg:table-cell text-center">{t("seller.products_manage.inventory").toUpperCase()}</th>
                       <th className="px-8 py-6 uppercase tracking-[0.2em] text-[10px] font-black text-right">{t("seller.products_manage.status").toUpperCase()}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/20">
                    <AnimatePresence mode="popLayout">
                       {loading && products.length === 0 ? (
                          <TableRowSkeleton />
                       ) : products.length === 0 ? (
                          <tr>
                             <td colSpan={5} className="px-8 py-32 text-center text-muted-foreground select-none grayscale">
                                <div className="flex flex-col items-center">
                                   <ImageIcon size={60} className="opacity-10 mb-4 animate-pulse" />
                                   <p className="text-xs font-black uppercase tracking-widest opacity-40">{t("seller.products_manage.no_products_yet")}</p>
                                </div>
                             </td>
                          </tr>
                       ) : (
                          products.map((p, idx) => (
                             <motion.tr
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.2 }}
                                onClick={() => setEditingId(p.id)}
                                className="hover:bg-muted/40 transition-colors group cursor-pointer h-24"
                             >
                                <td className="px-8 py-4">
                                   <div className="flex items-center gap-4 min-w-[200px]">
                                      <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center overflow-hidden border border-border/50 transition-transform group-hover:scale-110 duration-500 shadow-sm relative">
                                         {p.media && p.media.length > 0 ? (
                                            <img 
                                              src={p.media.find(m => String(m.is_primary) === 'true' || String(m.is_primary) === '1' || m.is_primary === true)?.full_url || p.media[0].full_url} 
                                              alt={p.title} 
                                              loading="lazy" 
                                              className="object-cover w-full h-full" 
                                            />
                                         ) : (
                                            <ImageIcon size={24} className="opacity-20" />
                                         )}
                                      </div>
                                      <div className="min-w-0">
                                         <p className="font-black text-[13px] uppercase tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                                            {p.title}
                                         </p>
                                         <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">ID: #{p.id}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-4 hidden sm:table-cell">
                                   <Badge variant="outline" className="px-3 py-1 rounded-xl font-black text-[9px] tracking-widest uppercase border-border/40 bg-background/50">
                                      {p.category?.name || t("seller.products_manage.unclassified")}
                                   </Badge>
                                </td>
                                <td className="px-8 py-4 font-black text-[14px] text-foreground/90 tabular-nums">
                                   {formatPrice(p.price)}
                                </td>
                                <td className="px-8 py-4 hidden lg:table-cell text-center">
                                   {p.stock_quantity > 0 ? (
                                      <div className="flex flex-col items-center">
                                         <span className="text-[13px] font-black">{p.stock_quantity}</span>
                                         <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{t("seller.products_manage.units_available")}</span>
                                      </div>
                                   ) : (
                                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-black text-[9px] tracking-widest uppercase px-3">
                                         {t("seller.products_manage.out_of_stock")}
                                      </Badge>
                                   )}
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <StatusBadge status={p.status} t={t} reason={p.ban_reason} />
                                </td>
                             </motion.tr>
                          ))
                       )}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>

           {/* 4. ELITE PAGINATION */}
           {totalPages > 1 && (
              <div className="p-8 border-t border-border/20 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    {t("seller.products_manage.pagination_page_of", { current: currentPage, total: totalPages })}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="w-12 h-12 rounded-2xl border-border/50 bg-background shadow-none flex items-center justify-center p-0"
                    >
                       <ChevronLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-2 px-2">
                       {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                             <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={cn(
                                   "w-12 h-12 rounded-2xl text-[11px] font-black transition-all",
                                   currentPage === pageNum 
                                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                      : "bg-background border border-border/50 hover:border-primary/50 text-muted-foreground"
                                )}
                             >
                                {pageNum}
                             </button>
                          );
                       })}
                    </div>
                    <Button 
                      variant="outline" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl border-border/50 bg-background shadow-none flex items-center justify-center p-0"
                    >
                       <ChevronRight size={20} />
                    </Button>
                 </div>
              </div>
           )}
        </Card>

        {/* 5. MODAL SYSTEM */}
        <AnimatePresence>
           {editingId !== null && (
              <EditProductModal
                productId={editingId}
                onClose={() => setEditingId(null)}
                onSuccess={() => { setEditingId(null); fetchProducts(currentPage, search, statusFilter); }}
              />
           )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

// --- Helper Components ---

function QuickStat({ label, value, icon: Icon }: any) {
   return (
      <div className="flex items-center gap-4 bg-muted/20 border border-border/50 px-6 py-4 rounded-[1.5rem] shadow-sm group hover:bg-muted/30 transition-all">
         <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
            <Icon size={20} strokeWidth={2.5} />
         </div>
         <div>
            <p className="text-[9px] font-black uppercase opacity-40 tracking-widest leading-none mb-1">{label}</p>
            <p className="text-[13px] font-black tracking-tight">{value}</p>
         </div>
      </div>
   );
}

function StatusBadge({ status, t, reason }: any) {
   switch (status) {
      case 'active':
         return (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
               {t("seller.products_manage.active")}
            </Badge>
         );
      case 'hide':
         return (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
               {t("seller.products_manage.hide")}
            </Badge>
         );
      case 'out_of_stock':
         return (
            <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
               {t("seller.products_manage.out_of_stock").toUpperCase()}
            </Badge>
         );
      case 'banned':
         return (
            <div className="flex flex-col items-end gap-1">
               <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-black text-[9px] tracking-widest uppercase px-3 h-6">
                  {t("seller.products_manage.banned")}
               </Badge>
               {reason && <span className="text-[8px] font-bold text-red-500 opacity-60 uppercase italic tracking-tighter">{t("seller.products_manage.violation_recorded")}</span>}
            </div>
         );
      default:
         return (
            <Badge variant="outline" className="font-black text-[9px] tracking-widest uppercase px-3 h-6 border-border/50">
               {status}
            </Badge>
         );
   }
}

function TableRowSkeleton() {
   return [...Array(5)].map((_, i) => (
      <tr key={i} className="h-24">
         <td className="px-8 py-4"><div className="w-full h-12 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4"><div className="w-24 h-8 bg-muted/40 rounded-xl animate-pulse mx-auto" /></td>
         <td className="px-8 py-4"><div className="w-20 h-6 bg-muted/40 rounded-xl animate-pulse" /></td>
         <td className="px-8 py-4"><div className="w-16 h-8 bg-muted/40 rounded-xl animate-pulse mx-auto" /></td>
         <td className="px-8 py-4"><div className="w-24 h-8 bg-muted/40 rounded-xl animate-pulse ml-auto" /></td>
      </tr>
   ));
}
