"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Plus, Trash2, Edit2, ShieldAlert, Image as ImageIcon, Save, X, ExternalLink, Package, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminBannersPage() {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get full image URL
  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
    const baseUrl = API_URL.replace("/api", "");
    return `${baseUrl}${path}`;
  };
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    product_id: null as number | null,
    active: true,
    image: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Product Search State
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

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
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (img.width <= img.height) {
             setPendingImage(file);
             setImageWarning(t("admin.banners.aspect_ratio_warning"));
             // Reset input value to allow re-selecting same file if canceled
             e.target.value = "";
             return;
          }
          setFormData(prev => ({ ...prev, image: file }));
          setPreviewUrl(URL.createObjectURL(file));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmImage = () => {
    if (pendingImage) {
      setFormData(prev => ({ ...prev, image: pendingImage }));
      setPreviewUrl(URL.createObjectURL(pendingImage));
      setPendingImage(null);
      setImageWarning(null);
    }
  };

  const cancelImage = () => {
    setPendingImage(null);
    setImageWarning(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      product_id: null,
      active: true,
      image: null
    });
    setPreviewUrl(null);
    setEditingBanner(null);
    setSelectedProduct(null);
    setProductSearch("");
    setSearchResults([]);
    setShowDeleteConfirm(false);
    setImageWarning(null);
    setPendingImage(null);
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
       toast.warning(t("admin.banners.select_product_warning"));
       return;
    }
    data.append("product_id", formData.product_id.toString());
    data.append("active", formData.active ? "1" : "0");
    if (!formData.image && !editingBanner) {
       toast.warning(t("admin.banners.upload_image_warning"));
       return;
    }
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
      toast.success(editingBanner ? t("admin.banners.update_success") : t("admin.banners.create_success"));
    } catch (err: any) {
      console.error("Failed to save banner", err);
      const msg = err.response?.data?.message || t("admin.banners.save_error");
      const errors = err.response?.data?.errors;
      if (errors) {
        const detailMsg = Object.values(errors).flat().join("\n");
        toast.error(msg, { description: detailMsg });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
      setIsModalOpen(false);
      resetForm();
      toast.success(t("admin.banners.delete_success"));
    } catch (err) {
      console.error("Failed to delete banner", err);
      toast.error(t("admin.banners.delete_error"));
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.id });
    setProductSearch("");
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-7xl mx-auto"
      >
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-8 gap-6 mb-12">
        <div className="text-center md:text-left space-y-2">
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">{t("admin.banners.title")}</h1>
           <p className="text-muted-foreground font-bold text-[10px] uppercase opacity-70 tracking-widest">{t("admin.banners.desc")}</p>
        </div>
        <Button 
           onClick={handleOpenAdd}
           size="lg"
           className="h-14 px-10 text-[10px] tracking-widest font-black uppercase"
        >
           <Plus size={20} className="mr-2" strokeWidth={3} />
           {t("admin.banners.add")}
        </Button>
      </div>

      {loading ? (
         <div className="flex h-64 items-center justify-center">
           <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
         </div>
      ) : banners.length === 0 ? (
         <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t("admin.banners.no_banners")}</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
               <Card 
                 key={banner.id} 
                 onClick={() => handleOpenEdit(banner)}
                 className="overflow-hidden border-border/50 group cursor-pointer"
               >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                     {banner.image_path ? (
                        <img src={getFullImageUrl(banner.image_path)!} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <ImageIcon className="text-muted-foreground/20" size={40} />
                        </div>
                     )}
                     
                     <div className="absolute top-2 left-2 z-10 flex gap-2">
                        {banner.active ? (
                           <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider shadow-lg">
                              {t("admin.banners.status_active")}
                           </span>
                        ) : (
                           <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-lg uppercase tracking-wider shadow-lg">
                              {t("admin.banners.status_hidden")}
                           </span>
                        )}
                     </div>
                  </div>
                  <div className="p-4">
                     <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                           <h3 className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{banner.title || "Untitled"}</h3>
                           <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                        </div>
                     </div>
                     {banner.product && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[10px] text-primary font-bold overflow-hidden">
                           <Package size={12} />
                           <span className="truncate">{t("admin.banners.product_prefix")}{banner.product.title}</span>
                        </div>
                     )}
                     {/* Legacy link_url display removed */}
                  </div>
               </Card>
            ))}
         </div>
      )}

      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-border/50 bg-white/95 dark:bg-slate-900/95 hover:scale-100">
               <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/20">
                  <h2 className="font-bold text-xl uppercase tracking-tight">{editingBanner ? t("admin.banners.edit") : t("admin.banners.add")}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X size={24} /></button>
               </div>

               <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto [scrollbar-gutter:stable]">
                  <div className="space-y-4">
                     {/* Image Preview / Upload */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("admin.banners.image_label")}</label>
                        <div 
                          className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 relative flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => !imageWarning && document.getElementById('imageInput')?.click()}
                        >
                           {previewUrl ? (
                              <img src={getFullImageUrl(previewUrl)!} className="w-full h-full object-cover animate-in fade-in duration-500" />
                           ) : (
                               <div className="text-center p-4">
                                  <ImageIcon className="mx-auto mb-2 text-muted-foreground" size={32} />
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{t("admin.banners.upload_hint")}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{t("admin.banners.aspect_ratio_hint")}</p>
                               </div>
                           )}

                           {/* Image Validation Overlay */}
                           {imageWarning && (
                              <div className="absolute inset-0 z-20 bg-amber-600/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                                 <ShieldAlert className="text-white mb-2" size={32} />
                                 <p className="text-white text-xs font-medium leading-relaxed mb-4">{imageWarning}</p>
                                 <div className="flex gap-2 w-full max-w-xs">
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); cancelImage(); }}
                                      className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-xs transition-colors"
                                    >
                                       {t("profile_page.cancel")}
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); confirmImage(); }}
                                      className="flex-[2] py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-bold text-xs transition-colors shadow-lg"
                                    >
                                       {t("admin.banners.continue_btn")}
                                    </button>
                                 </div>
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
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("admin.banners.title_label")}</label>
                           <Input 
                              type="text" 
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              className="h-12"
                              placeholder={t("admin.banners.placeholder_title")}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("admin.banners.subtitle_label")}</label>
                           <Input 
                              type="text" 
                              value={formData.subtitle}
                              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                              className="h-12"
                              placeholder={t("admin.banners.placeholder_subtitle")}
                           />
                        </div>
                     </div>

                     <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t("admin.banners.product_link_label")}</label>
                        {selectedProduct ? (
                           <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
                              <div className="flex items-center gap-4 min-w-0 flex-1 mr-2">
                                 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                                    <Package size={24} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold truncate" title={selectedProduct.title}>{selectedProduct.title}</p>
                                    <p className="text-[10px] text-muted-foreground opacity-70">ID: {selectedProduct.id}</p>
                                 </div>
                              </div>
                              <Button 
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedProduct(null); setFormData({...formData, product_id: null}); }}
                                className="hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                              >
                                 <Trash2 size={18} />
                              </Button>
                           </div>
                        ) : (
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={18} />
                              <Input 
                                 type="text" 
                                 value={productSearch}
                                 onChange={(e) => setProductSearch(e.target.value)}
                                 className="pl-12 h-12"
                                 placeholder={t("admin.banners.search_product_placeholder")}
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
                              <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
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

                   <div className="pt-6 border-t border-border/50 mt-4 space-y-4">
                      <div className="flex gap-4">
                         <Button 
                           type="button"
                           variant="outline"
                           onClick={() => setIsModalOpen(false)}
                           className="flex-1 h-14 text-[10px] tracking-widest font-black uppercase"
                         >
                            {t("profile_page.cancel")}
                         </Button>
                         <Button 
                           type="submit"
                           className="flex-1 h-14 text-[10px] tracking-widest font-black uppercase"
                         >
                            {editingBanner ? t("seller.products_manage.update") : t("admin.banners.add")}
                         </Button>
                      </div>
                      
                      {editingBanner && (
                        <div className="pt-4 border-t border-dashed border-border/50">
                           {!showDeleteConfirm ? (
                             <Button 
                               type="button"
                               variant="destructive"
                               onClick={() => setShowDeleteConfirm(true)}
                               className="w-full h-12 text-[10px] tracking-widest font-black uppercase bg-destructive/10 text-destructive border-transparent hover:bg-destructive hover:text-white"
                             >
                                <Trash2 size={16} className="mr-2" />
                                {t("inbox.delete")} Banner
                             </Button>
                           ) : (
                             <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                <Button 
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowDeleteConfirm(false)}
                                  className="flex-1 h-12 text-[10px] font-black uppercase"
                                >
                                   {t("admin.banners.back_btn")}
                                </Button>
                                <Button 
                                  type="button"
                                  variant="destructive"
                                  onClick={() => handleDelete(editingBanner.id)}
                                  className="flex-[2] h-12 text-[10px] font-black uppercase"
                                >
                                   {t("admin.banners.confirm_delete_btn")}
                                </Button>
                             </div>
                           )}
                        </div>
                      )}
                   </div>
                </form>
             </Card>
          </div>
       )}
      </motion.div>
    </div>
  );
}
