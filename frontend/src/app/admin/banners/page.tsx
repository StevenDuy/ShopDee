"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, ShieldAlert, Image as ImageIcon, Save, X, ExternalLink, Package, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminBannersPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    product_id: null as number | null,
    active: true,
    order: 0,
    image: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Product Search State
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchBanners = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(res.data);
    } catch (err) {
      console.error("Failed to load banners", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch.trim().length >= 2) {
        searchProducts(productSearch);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const searchProducts = async (query: string) => {
    if (!token) return;
    try {
      setIsSearchingProducts(true);
      const res = await axios.get(`${API_URL}/admin/banners/search-products?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      product_id: null,
      active: true,
      order: 0,
      image: null
    });
    setPreviewUrl(null);
    setEditingBanner(null);
    setSelectedProduct(null);
    setProductSearch("");
    setSearchResults([]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      product_id: banner.product_id || null,
      active: !!banner.active,
      order: banner.order || 0,
      image: null
    });
    setPreviewUrl(banner.image_path);
    setSelectedProduct(banner.product || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const data = new FormData();
    data.append("title", formData.title);
    data.append("subtitle", formData.subtitle);
    if (!formData.product_id) {
       alert("Vui lòng chọn sản phẩm để liên kết banner!");
       return;
    }
    data.append("product_id", formData.product_id.toString());
    data.append("active", formData.active ? "1" : "0");
    data.append("order", formData.order.toString());
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editingBanner) {
        // Laravel method spoofing for PUT with FormData
        data.append("_method", "PUT"); 
        await axios.post(`${API_URL}/admin/banners/${editingBanner.id}`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      } else {
        await axios.post(`${API_URL}/admin/banners`, data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
    } catch (err) {
      console.error("Failed to save banner", err);
      alert("Error saving banner. Please check all fields.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm(t("admin.banners.delete_confirm"))) return;
    try {
      await axios.delete(`${API_URL}/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (err) {
      console.error("Failed to delete banner", err);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.id });
    setProductSearch("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">{t("admin.banners.title")}</h1>
           <p className="text-muted-foreground mt-1">{t("admin.banners.desc")}</p>
        </div>
        <button 
           onClick={handleOpenAdd}
           className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
           <Plus size={20} />
           {t("admin.banners.add")}
        </button>
      </div>

      {loading ? (
         <div className="flex h-64 items-center justify-center">
           <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
         </div>
      ) : banners.length === 0 ? (
         <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t("admin.banners.no_banners")}</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
               <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-all">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                     {banner.image_path ? (
                        <img src={banner.image_path} alt={banner.title} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <ImageIcon className="text-muted-foreground/20" size={40} />
                        </div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenEdit(banner)}
                          className="p-2 bg-white/90 dark:bg-black/90 text-primary rounded-lg shadow-sm hover:bg-primary hover:text-white transition-colors"
                        >
                           <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 bg-white/90 dark:bg-black/90 text-red-500 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                     {!banner.active && (
                         <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">{t("admin.banners.active_label")}: NO</span>
                         </div>
                     )}
                  </div>
                  <div className="p-4">
                     <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                           <h3 className="font-bold line-clamp-1">{banner.title || "Untitled"}</h3>
                           <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                        </div>
                        <span className="shrink-0 w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">#{banner.order}</span>
                     </div>
                     {banner.product && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[10px] text-primary font-bold overflow-hidden">
                           <Package size={12} />
                           <span className="truncate">Sản phẩm: {banner.product.title}</span>
                        </div>
                     )}
                     {/* Legacy link_url display removed */}
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Modal / Form */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                  <h2 className="font-bold">{editingBanner ? t("admin.banners.edit") : t("admin.banners.add")}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X size={20} /></button>
               </div>

               <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                     {/* Image Preview / Upload */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("admin.banners.image_label")}</label>
                        <div 
                          className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 relative flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => document.getElementById('imageInput')?.click()}
                        >
                           {previewUrl ? (
                              <img src={previewUrl} className="w-full h-full object-cover" />
                           ) : (
                              <div className="text-center p-4">
                                 <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={32} />
                                 <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Click to upload image</p>
                              </div>
                           )}
                           <input 
                             type="file" 
                             id="imageInput" 
                             className="hidden" 
                             accept="image/*" 
                             onChange={handleFileChange} 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiêu đề</label>
                           <input 
                              type="text" 
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                              placeholder="Nhập tiêu đề banner"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("admin.banners.subtitle_label")}</label>
                           <input 
                              type="text" 
                              value={formData.subtitle}
                              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                              placeholder="Nhập phụ đề"
                           />
                        </div>
                     </div>

                     <div className="space-y-1 relative">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liên kết sản phẩm</label>
                        {selectedProduct ? (
                           <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                    <Package size={20} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{selectedProduct.title}</p>
                                    <p className="text-[10px] text-muted-foreground">ID: {selectedProduct.id}</p>
                                 </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => { setSelectedProduct(null); setFormData({...formData, product_id: null}); }}
                                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        ) : (
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                              <input 
                                 type="text" 
                                 value={productSearch}
                                 onChange={(e) => setProductSearch(e.target.value)}
                                 className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                 placeholder="Tìm kiếm sản phẩm để liên kết..."
                              />
                           </div>
                        )}
                        
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && !selectedProduct && (
                           <div className="absolute z-[60] left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                              {searchResults.map((p) => (
                                 <button 
                                   key={p.id}
                                   type="button"
                                   onClick={() => handleSelectProduct(p)}
                                   className="w-full p-3 text-left hover:bg-muted flex items-center gap-3 border-b border-border/50 last:border-0"
                                 >
                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground">
                                       <Package size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className="text-xs font-bold truncate">{p.title}</p>
                                       <p className="text-[9px] text-muted-foreground"> {p.price.toLocaleString()}đ</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}
                        
                        {isSearchingProducts && (
                           <div className="absolute right-4 top-[38px]">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                           </div>
                        )}
                     </div>

                     {/* Link URL field removed */}

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("admin.banners.order_label")}</label>
                           <input 
                              type="number" 
                              value={formData.order}
                              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                           />
                        </div>
                        <div className="flex flex-col justify-end pb-1">
                           <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                 type="checkbox" 
                                 checked={formData.active}
                                 onChange={(e) => setFormData({...formData, active: e.target.checked})}
                                 className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary/20 accent-primary"
                              />
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{t("admin.banners.active_label")}</span>
                           </label>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                     <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-all"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit"
                       className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                     >
                        {editingBanner ? t("seller.products_manage.update") : t("admin.banners.add")}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
