"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { EditProductModal } from "@/components/seller/EditProductModal";

const API = "http://localhost:8000/api";

type Product = {
  id: number;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  category?: { name: string };
  media?: { url: string }[];
};

export default function SellerProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProducts = () => {
    if (!token) return;
    setLoading(true);
    axios.get(`${API}/seller/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProducts(res.data.data || []))
      .catch(err => console.error("Error fetching products", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory and catalog.</p>
        </div>
        <Link href="/seller/products/new" className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Inventory</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="animate-pulse">Loading products...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ImageIcon size={48} className="opacity-20 mb-3" />
                      <p>You haven't listed any products yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden text-muted-foreground shrink-0 border border-border">
                        {p.media && p.media.length > 0 ? (
                           // eslint-disable-next-line @next/next/no-img-element
                          <img src={`http://localhost:8000${p.media[0].url}`} alt={p.title} className="object-cover w-full h-full" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>
                      <span className="truncate max-w-[200px]">{p.title}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.category?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                    </td>
                    <td className="px-6 py-4">
                      {p.stock_quantity > 0 ? (
                        <span>{p.stock_quantity} in stock</span>
                      ) : (
                        <span className="text-destructive font-medium">Out of stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">{p.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingId(p.id)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
