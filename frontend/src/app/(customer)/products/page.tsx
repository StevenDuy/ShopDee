"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, X, ArrowUpDown, ChevronRight, TrendingUp, Clock, ArrowDown, ArrowUp } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";
import { EliteCombobox } from "@/components/ui/elite-combobox";

interface Category { id: number; name: string; slug: string; children?: Category[] }
interface Product {
  id: number; title: string; slug: string; price: number; sale_price: number | null;
  category: Category | null;
  media: { full_url: string; is_primary: boolean }[];
  seller_id: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrencyStore();
  const img = product.media.find((m) => m.is_primary)?.full_url ?? product.media[0]?.full_url ?? `https://picsum.photos/seed/${product.id}/300/300`;
 
  return (
    <Link href={`/products/${product.slug}`} className="block group h-full">
      <div className="h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.sale_price && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg rotate-[-5deg] z-10">
              -{Math.round((1 - product.sale_price / product.price) * 100)}%
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col gap-2">
          {product.category && (
            <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.2em]">
              {product.category.name}
            </p>
          )}
          <h3 className="font-bold text-sm line-clamp-2 leading-tight uppercase transition-colors group-hover:text-primary">
            {product.title}
          </h3>
 
          <div className="mt-auto pt-2 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-black text-base text-primary tracking-tighter">
                {formatPrice(product.sale_price ?? product.price)}
              </span>
              {product.sale_price && (
                <span className="text-[10px] text-muted-foreground line-through font-medium opacity-40">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border/10 pt-3 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={10} className={s <= 4 ? "fill-primary text-primary" : "fill-muted text-muted"} />
                ))}
                <span className="text-[10px] font-black ml-1.5">4.0</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <ChevronRight size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
 
export default function ProductsPage() {
  const { t } = useTranslation();
  const { formatPrice, currency } = useCurrencyStore();
  const searchParams = useSearchParams();
  const router = useRouter();
 
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
 
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
 
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };
 
  const toggleSort = (type: "newest" | "best_sellers" | "price") => {
    let nextSort = "";
    if (type === "newest") {
      nextSort = sort === "newest" ? "oldest" : "newest";
    } else if (type === "best_sellers") {
      nextSort = sort === "best_sellers" ? "worst_sellers" : "best_sellers";
    } else if (type === "price") {
      nextSort = sort === "price_asc" ? "price_desc" : "price_asc";
    }
    updateParam("sort", nextSort);
  };
 
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page: String(currentPage), limit: "16" });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      const res = await axios.get(`${API}/products?${params}`);
      const data = res.data;
      setProducts(data.data ?? data ?? []);
      setTotalPages(data.last_page ?? 1);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [search, category, sort, minPrice, maxPrice, currentPage]);
 
  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [fetchProducts]);
 
  useEffect(() => { 
    axios.get(`${API}/products/categories`).then(r => setCategories(r.data)).catch(() => { }); 
  }, []);
 
  const filteredCategories = categories.filter(c => {
    const matchParent = c.name.toLowerCase().includes(categorySearch.toLowerCase());
    const matchChildren = c.children?.some(child => child.name.toLowerCase().includes(categorySearch.toLowerCase()));
    return matchParent || matchChildren;
  });
 
  return (
    <div className="min-h-screen bg-background text-foreground relative animate-in fade-in duration-700">
      
      {/* Search Header Row */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 h-[80px]">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center px-6 gap-4">
          <div className="relative flex-1">
            <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              defaultValue={search}
              placeholder={t("products_page.search_placeholder")}
              onChange={(e) => updateParam("search", e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-muted/30 border-2 border-border/50 rounded-2xl font-black uppercase text-xs tracking-widest focus:outline-none focus:border-primary transition-all focus:bg-background h-14"
            />
          </div>
 
          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center justify-center gap-2 h-14 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-primary/20"
          >
            <SlidersHorizontal size={18} strokeWidth={3} />
            <span className="hidden md:inline">{t("products_page.filter_label")}</span>
          </button>
        </div>
      </div>
 
      {/* FILTER DRAWER */}
      <div 
        className={`fixed inset-0 z-[200] transition-opacity duration-500 ${showFilters ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setShowFilters(false)}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      </div>
 
      <aside className={`fixed top-0 right-0 h-full w-[340px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-[201] shadow-2xl transition-all duration-500 flex flex-col ${showFilters ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-[80px] shrink-0 border-b border-border/10 flex items-center justify-between px-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">{t("products_page.filters")}</h2>
          <button 
            onClick={() => setShowFilters(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
 
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Category Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{t("products_page.categories_label")}</h3>
            <EliteCombobox
              value={category}
              onChange={(val) => updateParam("category", val === "all" ? "" : val)}
              options={[
                { label: t("products_page.all_categories"), value: "all" },
                ...categories.flatMap(c => [
                  { label: c.name.toUpperCase(), value: c.slug },
                  ...(c.children?.map(child => ({
                    label: `  ↳ ${child.name.toUpperCase()}`,
                    value: child.slug
                  })) || [])
                ])
              ]}
              placeholder={t("products_page.search_categories_placeholder")}
            />
          </div>
 
          {/* Sort Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{t("products_page.sort_label")}</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => toggleSort("newest")}
                className={`flex items-center justify-between px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${sort === "newest" || sort === "oldest" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"}`}>
                <div className="flex items-center gap-3"><Clock size={16} /> {sort === "oldest" ? t("products_page.sort_oldest") : t("products_page.sort_newest")}</div>
                {sort === "oldest" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>
 
              <button onClick={() => toggleSort("best_sellers")}
                className={`flex items-center justify-between px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${sort === "best_sellers" || sort === "worst_sellers" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"}`}>
                <div className="flex items-center gap-3"><TrendingUp size={16} /> {sort === "worst_sellers" ? t("products_page.sort_worst_sellers") : t("products_page.sort_best_sellers")}</div>
                {sort === "worst_sellers" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>
 
              <button onClick={() => toggleSort("price")}
                className={`flex items-center justify-between px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${sort.startsWith("price") ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"}`}>
                <div className="flex items-center gap-3"><ArrowUpDown size={16} /> {sort === "price_desc" ? t("products_page.sort_price_desc") : t("products_page.sort_price_asc")}</div>
                {sort === "price_desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              </button>
            </div>
          </div>
 
          {/* Price Range Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{t("products_page.price_range_label", { currency: currency })}</h3>
            <div className="flex items-center gap-3">
              <input type="number" placeholder={t("products_page.min_price")} defaultValue={minPrice}
                onChange={(e) => updateParam("min_price", e.target.value)}
                className="w-full px-4 py-4 bg-muted/30 border border-border/50 rounded-xl font-black text-xs focus:outline-none focus:border-primary h-14" />
              <div className="w-4 h-0.5 bg-border/50 shrink-0" />
              <input type="number" placeholder={t("products_page.max_price")} defaultValue={maxPrice}
                onChange={(e) => updateParam("max_price", e.target.value)}
                className="w-full px-4 py-4 bg-muted/30 border border-border/50 rounded-xl font-black text-xs focus:outline-none focus:border-primary h-14" />
            </div>
          </div>
 
          {/* Clear Button */}
          {(search || category || sort !== "newest" || minPrice || maxPrice) && (
            <button 
              onClick={() => { router.push("/products"); setShowFilters(false); }}
              className="w-full py-5 bg-red-600/10 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
            >
              <X size={14} strokeWidth={3} className="inline mr-2" /> {t("products_page.clear_all")}
            </button>
          )}
        </div>
      </aside>
 
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 && !loading ? (
          <div className="text-center py-32 bg-muted/20 border-2 border-dashed border-border/50 rounded-[3rem]">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-muted-foreground opacity-30" />
            </div>
            <p className="text-2xl font-black uppercase tracking-tighter text-muted-foreground italic">{t("products_page.no_products")}</p>
            <button onClick={() => router.push("/products")} className="mt-8 px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl">
              {t("products_page.try_again")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
 
        {/* Elite Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-20 pt-10 border-t border-border/10">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-12 h-12 rounded-2xl font-black text-xs transition-all duration-300 ${currentPage === i + 1 ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110" : "bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



