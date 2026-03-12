"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon, Trash2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

const API = "http://localhost:8000/api";

type Category = {
  id: number;
  name: string;
  children: Category[];
};

export default function NewProductPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    price: "",
    stock: "",
    description: "",
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories for dropdown
    axios.get(`${API}/products/categories`)
      .then(res => setCategories(res.data || []))
      .catch(err => console.error("Error fetching categories", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/seller/products`, {
        title: formData.title,
        category_id: formData.categoryId,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock),
        description: formData.description,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const productId = res.data.id;
      
      // Upload files if any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fileData = new FormData();
          fileData.append('file', files[i]);
          if (i === 0) fileData.append('is_primary', '1');
          
          await axios.post(`${API}/seller/products/${productId}/media`, fileData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }

      router.push("/seller/products");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to create product");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seller/products" className="p-2 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground mt-1">Create a new product listing in your store.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold">General Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Product Title <span className="text-destructive">*</span></label>
              <input 
                type="text" name="title" required
                value={formData.title} onChange={handleChange}
                placeholder="E.g. Apple iPhone 15 Pro Max"
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description <span className="text-destructive">*</span></label>
              <textarea 
                name="description" required rows={5}
                value={formData.description} onChange={handleChange}
                placeholder="Detailed description of the product..."
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>
          </div>

          {/* Media upload container */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold">Media</h2>
              <p className="text-sm text-muted-foreground">Upload product images (first image is primary)</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square border border-border rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] uppercase font-bold rounded-md">Primary</span>
                  )}
                </div>
              ))}
              
              <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors">
                <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-2">
                  <ImageIcon size={20} />
                </div>
                <span className="text-sm font-medium">Add Media</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold">Organization</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category <span className="text-destructive">*</span></label>
              <select 
                name="categoryId" required
                value={formData.categoryId} onChange={handleChange}
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    <option value={cat.id}>{cat.name}</option>
                    {cat.children && cat.children.map(child => (
                      <option key={child.id} value={child.id}>-- {child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold">Pricing & Inventory</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Base Price (VNĐ) <span className="text-destructive">*</span></label>
              <input 
                type="number" name="price" required min="0" step="1"
                value={formData.price} onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stock Quantity <span className="text-destructive">*</span></label>
              <input 
                type="number" name="stock" required min="0" step="1"
                value={formData.stock} onChange={handleChange}
                placeholder="100"
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save size={18} /> Publish Product</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
