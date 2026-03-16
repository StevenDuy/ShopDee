"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { EditProductModal } from "@/components/seller/EditProductModal";
import { useTranslation } from "react-i18next";

const API = "http://localhost:8000/api";

type Product = {
  id: number;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
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

  const fetchProducts = (page = 1, query = "") => {
    if (!token) return;
    setLoading(true);
    axios.get(`${API}/seller/products?page=${page}${query ? `&search=${query}` : ""}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setProducts(res.data.data || []);
        setTotalPages(res.data.last_page || 1);
        setCurrentPage(res.data.current_page || 1);
      })
      .catch(err => console.error("Error fetching products", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts(currentPage, search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    fetchProducts(1, val);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm(t("common.confirm_delete", { defaultValue: "Are you sure you want to delete this product?" }))) return;
    
    try {
      await axios.delete(`${API}/seller/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product. It might be linked to existing orders.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("seller.products")}</h1>
          <p className="text-muted-foreground mt-1">{t("seller.products_manage.desc")}</p>
        </div>
        <Link href="/seller/products/new" className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
          <Plus size={18} />
          {t("seller.products_manage.add_product")}
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder={t("products_page.search_placeholder")} 
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">{t("seller.products_manage.product")}</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px] hidden sm:table-cell">{t("seller.products_manage.category")}</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">{t("seller.products_manage.price")}</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px] hidden lg:table-cell">{t("seller.products_manage.inventory")}</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">{t("seller.products_manage.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="animate-pulse">{t("seller.products_manage.loading_products")}</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ImageIcon size={48} className="opacity-20 mb-3" />
                      <p>{t("seller.products_manage.no_products_yet")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setEditingId(p.id)}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden text-muted-foreground shrink-0 border border-border">
                        {p.media && p.media.length > 0 ? (
                           // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.media[0].full_url} alt={p.title} loading="lazy" className="object-cover w-full h-full" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>
                      <span className="truncate max-w-[150px] md:max-w-[250px] group-hover:text-primary transition-colors">{p.title}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">
                      <span className="bg-muted px-2 py-1 rounded text-xs">{p.category?.name || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat(t("locale"), { style: 'currency', currency: t("currency_code") }).format(p.price)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                      {p.stock_quantity > 0 ? (
                        <span className="text-foreground">{p.stock_quantity} {t("seller.products_manage.in_stock")}</span>
                      ) : (
                        <span className="text-destructive font-medium">{t("seller.products_manage.out_of_stock")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{t("seller.products_manage.active")}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground border border-border capitalize">{p.status}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted hover:bg-muted/80"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {editingId && (
        <EditProductModal 
          productId={editingId} 
          onClose={() => setEditingId(null)} 
          onSuccess={() => { setEditingId(null); fetchProducts(); }} 
        />
      )}
    </div>
  );
}
