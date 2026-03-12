"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X, Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const API = "http://localhost:8000/api";

type Category = {
  id: number;
  name: string;
  children: Category[];
};

type ProductMedia = {
  id: number;
  url: string;
  is_primary: boolean;
};

type Product = {
  id: number;
  title: string;
  price: string | number;
  stock_quantity: string | number;
  status: string;
  category_id: number;
  description: string;
  media: ProductMedia[];
};

interface EditProductModalProps {
  productId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({ productId, onClose, onSuccess }: EditProductModalProps) {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (!token) return;
    Promise.all([
      axios.get(`${API}/products/categories`),
      axios.get(`${API}/seller/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data || []);
      setFormData(prodRes.data);
    }).catch(err => {
      console.error(err);
      setError("Failed to load product details.");
    }).finally(() => setLoading(false));
  }, [productId, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (formData) setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles([...newFiles, ...Array.from(e.target.files)]);
    }
  };

  const deleteExistingMedia = async (mediaId: number) => {
    if (!token || !formData) return;
    try {
      await axios.delete(`${API}/seller/products/${productId}/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        ...formData,
        media: formData.media.filter(m => m.id !== mediaId)
      });
    } catch (err) {
      console.error("Failed to delete media", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Update basic info
      await axios.put(`${API}/seller/products/${productId}`, {
        title: formData.title,
        category_id: formData.category_id,
        price: parseFloat(formData.price.toString()),
        stock_quantity: parseInt(formData.stock_quantity.toString()),
        description: formData.description,
        status: formData.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Upload new files if any
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = new FormData();
          fileData.append('file', newFiles[i]);
          
          await axios.post(`${API}/seller/products/${productId}/media`, fileData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }

      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to update product");
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted text-muted-foreground rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-product-form" onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      <option value={cat.id}>{cat.name}</option>
                      {cat.children?.map(child => <option key={child.id} value={child.id}>-- {child.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="active">Active</option>
                  <option value="inactive">Draft / Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <hr className="border-border" />
            
            <div>
               <h3 className="text-sm font-bold mb-3 flex justify-between items-center">
                 Media
               </h3>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                 {/* Existing Media */}
                 {formData.media?.map(m => (
                   <div key={m.id} className="relative aspect-square border border-border rounded-xl overflow-hidden group">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={`http://localhost:8000${m.url}`} alt="" className="object-cover w-full h-full" />
                     <button type="button" onClick={() => deleteExistingMedia(m.id)}
                       className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={12} />
                     </button>
                     {m.is_primary && (
                       <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] uppercase font-bold rounded-sm">Primary</span>
                     )}
                   </div>
                 ))}

                 {/* New Media Preview */}
                 {newFiles.map((file, i) => (
                   <div key={`new-${i}`} className="relative aspect-square border-2 border-primary/50 rounded-xl overflow-hidden group">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full opacity-70" />
                     <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/30">NEW</span>
                     <button type="button" onClick={() => setNewFiles(newFiles.filter((_, idx) => idx !== i))}
                       className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={12} />
                     </button>
                   </div>
                 ))}

                 {/* Upload Button */}
                 <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                  <Upload size={18} className="text-muted-foreground mb-1" />
                  <span className="text-[10px] font-medium text-muted-foreground">Upload</span>
                 </label>
               </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
            Cancel
          </button>
          <button type="submit" form="edit-product-form" disabled={saving}
            className="bg-primary text-primary-foreground flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
