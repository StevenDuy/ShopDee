"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Star, ChevronDown, ShoppingCart, X } from "lucide-react";
import axios from "axios";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";

interface Category { id: number; name: string; slug: string; children?: Category[] }
interface Product  {
  id: number; title: string; slug: string; price: number; sale_price: number | null;
  category: Category | null;
  media: { url: string; is_primary: boolean }[];
  seller_id: number;
}

const API = "http://localhost:8000/api";
const SORT_OPTIONS = [
  { value: "newest",       label: "Newest" },
  { value: "best_sellers", label: "Best Sellers" },
  { value: "price_asc",    label: "Price: Low → High" },
  { value: "price_desc",   label: "Price: High → Low" },
];

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);
  const img = product.media.find((m) => m.is_primary)?.url ?? product.media[0]?.url ?? `https://picsum.photos/seed/${product.id}/300/300`;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group">
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.sale_price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - product.sale_price / product.price) * 100)}%
          </span>
        )}
      </Link>
      <div className="p-4">
        {product.category && <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>}
        <h3 className="font-semibold text-sm line-clamp-2 mb-3">{product.title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-primary text-sm">{formatPrice(product.sale_price ?? product.price)}</span>
          {product.sale_price && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
        </div>
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"} />)}
        </div>
        <button onClick={() => addItem({ id: product.id, productId: product.id, title: product.title, image: img, price: product.price, salePrice: product.sale_price, sellerId: product.seller_id, sellerName: "", attributes: {} })}
          className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state synced with URL
  const search     = searchParams.get("search") ?? "";
  const category   = searchParams.get("category") ?? "";
  const sort       = searchParams.get("sort") ?? "newest";
  const minPrice   = searchParams.get("min_price") ?? "";
  const maxPrice   = searchParams.get("max_price") ?? "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
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

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { axios.get(`${API}/products/categories`).then(r => setCategories(r.data)).catch(() => {}); }, []);

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              defaultValue={search}
              placeholder="Search products..."
              onChange={(e) => updateParam("search", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="pl-3 pr-8 py-2.5 bg-input border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-input border-border"}`}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Filters Row */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-wrap gap-3 max-w-7xl mx-auto">
            {/* Category */}
            <select value={category} onChange={(e) => updateParam("category", e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.slug}>{c.name} (All)</option>
                  {c.children?.map((child) => <option key={child.id} value={child.slug}>{child.name}</option>)}
                </optgroup>
              ))}
            </select>

            {/* Price range */}
            <input type="number" placeholder="Min price" defaultValue={minPrice}
              onChange={(e) => updateParam("min_price", e.target.value)}
              className="w-32 px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="number" placeholder="Max price" defaultValue={maxPrice}
              onChange={(e) => updateParam("max_price", e.target.value)}
              className="w-32 px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

            {(search || category || minPrice || maxPrice) && (
              <button onClick={() => router.push("/products")}
                className="flex items-center gap-1 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                <X size={14} /> Clear All
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Product Grid */}
      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-muted rounded-2xl aspect-[3/4] animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${currentPage === i + 1 ? "bg-primary text-primary-foreground" : "bg-input hover:bg-accent"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
