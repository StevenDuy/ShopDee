"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, X, ArrowUpDown, ChevronRight, TrendingUp, Clock, ArrowDown, ArrowUp } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";

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
    <Link href={`/products/${product.slug}`} className="block h-full group">
      <div className="bg-card border border-border h-full flex flex-col group-hover:border-primary transition-colors">
        <div className="relative aspect-square overflow-hidden bg-muted border-b border-border">
          <img
            src={img}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain p-2"
          />
          {product.sale_price && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 border border-white">
              -{Math.round((1 - product.sale_price / product.price) * 100)}%
            </span>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          {product.category && <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{product.category.name}</p>}
          <h3 className="font-bold text-xs line-clamp-2 mb-2 leading-tight uppercase">{product.title}</h3>

          <div className="mt-auto flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">{formatPrice(product.sale_price ?? product.price)}</span>
              {product.sale_price && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className={s <= 4 ? "fill-primary text-primary" : "fill-muted text-muted"} />)}
              <span className="text-[10px] font-mono ml-1">4.0</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation();
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

  const activeCategoryName = categories.find(c => c.slug === category)?.name || 
    categories.flatMap(c => c.children || []).find(c => c?.slug === category)?.name || 
    "Tất cả danh mục";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      
      {/* Mobile Sticky Header - Standardized and Synchronized */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch">
        <div className="w-14 shrink-0" /> {/* Menu Button Space */}
        <div className="flex-1 flex items-center px-2">
          <div className="relative w-full">
            <Search size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              defaultValue={search}
              placeholder={t("products_page.search_placeholder")}
              onChange={(e) => updateParam("search", e.target.value)}
              className="w-full pl-9 pr-4 h-11 bg-muted border-2 border-border font-bold text-xs uppercase focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className="w-14 shrink-0 flex items-center justify-center text-primary hover:opacity-80 transition-opacity"
          title="Filter"
        >
          <SlidersHorizontal size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Desktop Header for Filter/Search */}
      <div className="hidden lg:block sticky top-0 z-30 bg-background border-b-4 border-primary h-[74px]">
        <div className="max-w-7xl mx-auto w-full h-full">
          {/* Main Top Row (Matches Menu Button 74px) */}
          <div className="h-full flex items-center px-6 pl-14 lg:pl-6 gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                defaultValue={search}
                placeholder={t("products_page.search_placeholder")}
                onChange={(e) => updateParam("search", e.target.value)}
                className="w-full pl-9 pr-4 h-11 bg-muted border-2 border-border font-bold text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center gap-2 h-11 px-6 text-primary font-black uppercase text-xs tracking-widest hover:opacity-80 transition-opacity"
            >
              <SlidersHorizontal size={20} strokeWidth={2.5} />
              <span className="hidden md:inline">LỌC</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER SIDEBAR (RIGHT) */}
      <div 
        className={`fixed inset-0 z-[100] cursor-pointer transition-opacity duration-300 ${showFilters ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setShowFilters(false)}
      >
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      </div>

      <aside className={`fixed top-0 right-0 h-full w-[300px] bg-card border-l-4 border-primary z-[101] shadow-2xl transition-transform duration-300 flex flex-col ${showFilters ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-[74px] shrink-0 border-b-4 border-primary bg-muted/50 flex items-center justify-between px-6">
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary">Bộ lọc</h2>
          <button 
            onClick={() => setShowFilters(false)}
            className="p-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Category Section */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Danh mục</h3>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Tìm danh mục..." 
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-2 py-2 bg-muted border-2 border-border font-bold text-[10px] uppercase focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => { updateParam("category", ""); }}
                className={`w-full text-left px-3 py-2 border-2 text-[10px] font-bold uppercase transition-colors ${!category ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
              >
                Tất cả danh mục
              </button>
              <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredCategories.map(c => (
                  <div key={c.id} className="space-y-1">
                    <button 
                      onClick={() => { updateParam("category", c.slug); }}
                      className={`w-full text-left px-3 py-2 border-2 text-[10px] font-bold uppercase transition-colors ${category === c.slug ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
                    >
                      {c.name}
                    </button>
                    {c.children && c.children.length > 0 && category === c.slug && (
                      <div className="ml-4 space-y-1 border-l-2 border-primary pl-2 pt-1 pb-1">
                        {c.children.map(child => (
                          <button 
                            key={child.id}
                            onClick={() => { updateParam("category", child.slug); }}
                            className={`w-full text-left px-3 py-1.5 border-2 text-[10px] font-bold uppercase transition-colors ${category === child.slug ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sort Section */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Sắp xếp</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => toggleSort("newest")}
                className={`flex items-center justify-between px-3 py-3 border-2 font-bold text-[10px] uppercase ${sort === "newest" || sort === "oldest" ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} /> {sort === "oldest" ? "Cũ nhất" : "Mới nhất"}
                </div>
                {sort === "oldest" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>

              <button
                onClick={() => toggleSort("best_sellers")}
                className={`flex items-center justify-between px-3 py-3 border-2 font-bold text-[10px] uppercase ${sort === "best_sellers" || sort === "worst_sellers" ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} /> {sort === "worst_sellers" ? "Bán chậm" : "Bán chạy"}
                </div>
                {sort === "worst_sellers" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>

              <button
                onClick={() => toggleSort("price")}
                className={`flex items-center justify-between px-3 py-3 border-2 font-bold text-[10px] uppercase ${sort.startsWith("price") ? "bg-primary text-white border-black" : "bg-muted border-transparent hover:border-border"}`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={14} /> Giá: {sort === "price_desc" ? "Cao -> Thấp" : "Thấp -> Cao"}
                </div>
                {sort === "price_desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              </button>
            </div>
          </div>

          {/* Price Range Section */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Khoảng giá ($)</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="MIN" defaultValue={minPrice}
                onChange={(e) => updateParam("min_price", e.target.value)}
                className="w-full px-3 py-3 bg-muted border-2 border-border font-bold text-xs focus:outline-none focus:border-primary" />
              <span className="font-bold">-</span>
              <input type="number" placeholder="MAX" defaultValue={maxPrice}
                onChange={(e) => updateParam("max_price", e.target.value)}
                className="w-full px-3 py-3 bg-muted border-2 border-border font-bold text-xs focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Clear Button */}
          {(search || category || sort !== "newest" || minPrice || maxPrice) && (
            <button 
              onClick={() => { router.push("/products"); setShowFilters(false); }}
              className="w-full py-4 border-2 border-destructive text-destructive font-black text-xs uppercase hover:bg-destructive hover:text-white"
            >
              <X size={14} className="inline mr-1" /> Xóa toàn bộ lọc
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="container-2d py-8">
        {products.length === 0 && !loading ? (
          <div className="text-center py-24 border-4 border-dashed border-border bg-muted/50">
            <Search size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xl font-black uppercase tracking-widest">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center flex-wrap gap-1 mt-12 pt-8 border-t-4 border-border">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)}
                className={`min-w-[40px] h-10 border-2 font-black text-xs ${currentPage === i + 1 ? "bg-primary text-primary-foreground border-black" : "bg-card border-border hover:border-black"}`}
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



