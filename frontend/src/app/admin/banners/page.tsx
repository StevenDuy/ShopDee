"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Plus, Trash2, Edit2, ShieldAlert, Image as ImageIcon, 
  Save, X, ExternalLink, Package, Search 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

  const fetchBanners = async (isInitial = true) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      const res = await axios.get(`${API_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(res.data);
    } catch (err) {
      console.error("Failed to load banners", err);
    } finally {
      if (isInitial) setLoading(false);
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
      fetchBanners(false);
      toast.success(editingBanner ? t("admin.banners.update_success") : t("admin.banners.create_success"));
    } catch (err: any) {
      console.error("Failed to save banner", err);
      const msg = err.response?.data?.message || t("admin.banners.save_error");
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners(false);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="space-y-6 max-w-7xl mx-auto p-4 md:p-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-border/50 pb-6 gap-4 mb-8">
          <div className="text-center md:text-left space-y-1">
             <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">{t("admin.banners.title")}</h1>
             <p className="text-muted-foreground font-bold text-[9px] uppercase opacity-60 tracking-widest">{t("admin.banners.desc")}</p>
          </div>
          <Button 
             onClick={handleOpenAdd}
             size="sm"
             className="h-10 px-6 text-[10px] tracking-widest font-black uppercase shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
             <Plus size={16} className="mr-2" strokeWidth={3} />
             {t("admin.banners.add")}
          </Button>
        </div>

        {loading ? (
           <div className="flex h-64 items-center justify-center">
             <div className="w-6 h-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
           </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
              {banners.map((banner) => (
                 <Card 
                   key={banner.id} 
                   onClick={() => handleOpenEdit(banner)}
                   className="overflow-hidden border-border/40 group cursor-pointer hover:shadow-md transition-all rounded-xl bg-card/60"
                 >
                    <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                       {banner.image_path ? (
                          <img src={getFullImageUrl(banner.image_path)!} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <ImageIcon className="text-muted-foreground/20" size={32} />
                          </div>
                       )}
                       
                       <div className="absolute top-2 left-2 z-10 flex gap-1">
                          {banner.active ? (
                             <Badge className="bg-emerald-500/90 text-white text-[8px] font-black uppercase pointer-events-none px-1.5 h-5">
                                {t("admin.banners.status_active")}
                             </Badge>
                          ) : (
                             <Badge variant="secondary" className="bg-black/40 text-white text-[8px] font-black uppercase pointer-events-none px-1.5 h-5 backdrop-blur-sm">
                                {t("admin.banners.status_hidden")}
                             </Badge>
                          )}
                       </div>
                    </div>
                    <div className="p-3">
                       <h3 className="font-bold text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{banner.title || "Untitled"}</h3>
                       <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{banner.subtitle}</p>
                       {banner.product && (
                          <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5 text-[9px] text-primary/80 font-black uppercase tracking-tighter">
                             <Package size={10} />
                             <span className="truncate">{banner.product.title}</span>
                          </div>
                       )}
                    </div>
                 </Card>
              ))}
           </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
             <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                   animate={{ opacity: 1, scale: 1, y: 0 }} 
                   exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                   transition={{ duration: 0.2, ease: "circOut" }}
                   className="bg-background w-full max-w-2xl border border-border/50 shadow-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] transition-all"
                >
                   <div className="p-6 border-b border-border/40 bg-muted/10 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div>
                         <h2 className="font-black text-xl uppercase tracking-tighter text-foreground leading-none">
                            {editingBanner ? t("admin.banners.edit") : t("admin.banners.add")}
                         </h2>
                         <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1.5">VISUAL ASSET // COMPOSER</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl active:scale-95 bg-background shadow-sm border border-border/40">
                         <X size={20} strokeWidth={2.5} />
                      </Button>
                   </div>

                   <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                      <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1">{t("admin.banners.image_label")}</label>
                          <div 
                            className="aspect-video w-full max-w-md mx-auto rounded-3xl border-2 border-dashed border-border/60 bg-muted/20 relative flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-all group shadow-inner"
                            onClick={() => !imageWarning && document.getElementById('imageInput')?.click()}
                          >
                             {previewUrl ? (
                                <img src={getFullImageUrl(previewUrl)!} className="w-full h-full object-cover animate-in fade-in duration-500 group-hover:scale-105 transition-transform" />
                             ) : (
                                 <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border border-border/40 text-muted-foreground/30 group-hover:text-primary transition-colors">
                                       <ImageIcon size={32} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t("admin.banners.upload_hint")}</p>
                                 </div>
                             )}

                             {imageWarning && (
                                <div className="absolute inset-0 z-20 bg-amber-600/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
                                   <ShieldAlert className="text-white mb-3" size={40} strokeWidth={2} />
                                   <p className="text-white text-[11px] font-black uppercase tracking-tight leading-tight mb-6">{imageWarning}</p>
                                   <div className="flex gap-2 w-full">
                                      <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); cancelImage(); }} className="flex-1 h-10 bg-white/10 border-white text-white hover:bg-white hover:text-amber-600 font-black text-[9px] uppercase">
                                         {t("profile_page.cancel")}
                                      </Button>
                                      <Button type="button" onClick={(e) => { e.stopPropagation(); confirmImage(); }} className="flex-[1.5] h-10 bg-white text-amber-600 font-black text-[9px] uppercase">
                                         {t("admin.banners.continue_btn")}
                                      </Button>
                                   </div>
                                </div>
                             )}
                             <input type="file" id="imageInput" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1">{t("admin.banners.title_label")}</label>
                             <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="h-12 bg-muted/10 border-transparent rounded-xl text-sm font-bold shadow-none focus:bg-background transition-all"
                                placeholder="..."
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1">{t("admin.banners.subtitle_label")}</label>
                             <Input 
                                value={formData.subtitle}
                                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                                className="h-12 bg-muted/10 border-transparent rounded-xl text-sm font-bold shadow-none focus:bg-background transition-all"
                                placeholder="..."
                             />
                          </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1">{t("admin.banners.product_link_label")}</label>
                         {selectedProduct ? (
                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden animate-in zoom-in-95">
                               <div className="flex items-center gap-4 min-w-0 flex-1">
                                  <div className="w-12 h-12 bg-background rounded-xl border border-border/40 flex items-center justify-center text-primary shrink-0 shadow-sm">
                                     <Package size={24} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                     <p className="text-sm font-black uppercase tracking-tight text-foreground truncate">{selectedProduct.title}</p>
                                     <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mt-0.5">ID: {selectedProduct.id}</p>
                                  </div>
                               </div>
                               <Button 
                                 type="button"
                                 variant="ghost" 
                                 size="icon"
                                 onClick={() => { setSelectedProduct(null); setFormData({...formData, product_id: null}); }}
                                 className="w-10 h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive active:scale-95"
                               >
                                  <Trash2 size={18} />
                               </Button>
                            </div>
                         ) : (
                            <div className="relative group">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40 group-focus-within:text-primary transition-colors" size={18} />
                               <Input 
                                  type="text" 
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="pl-12 h-12 bg-muted/10 border-transparent rounded-xl text-sm font-bold shadow-none focus:bg-background transition-all"
                                  placeholder={t("admin.banners.search_product_placeholder")}
                                />
                               
                               <AnimatePresence>
                                {searchResults.length > 0 && (
                                   <motion.div 
                                     initial={{ opacity: 0, y: 5 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     exit={{ opacity: 0, y: 5 }}
                                     className="absolute z-[60] left-0 right-0 top-full mt-2 bg-background border border-border shadow-xl rounded-2xl max-h-48 overflow-y-auto p-1.5"
                                   >
                                      {searchResults.map((p) => (
                                         <button 
                                           key={p.id}
                                           type="button"
                                           onClick={() => handleSelectProduct(p)}
                                           className="w-full p-3 text-left hover:bg-muted flex items-center gap-3 rounded-xl transition-all"
                                         >
                                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground/40 shrink-0">
                                               <Package size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                               <p className="text-[11px] font-black uppercase tracking-tight truncate text-foreground">{p.title}</p>
                                               <p className="text-[9px] font-black text-primary/60 mt-0.5"> {p.price?.toLocaleString()}đ</p>
                                            </div>
                                         </button>
                                      ))}
                                   </motion.div>
                                )}
                               </AnimatePresence>
                            </div>
                         )}
                      </div>

                      <div className="flex items-center justify-between p-5 bg-muted/5 border border-border/40 rounded-2xl">
                         <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${formData.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-muted-foreground/30'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground">
                               {formData.active ? t("admin.banners.status_active") : t("admin.banners.status_hidden")}
                            </span>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                               type="checkbox" 
                               checked={formData.active}
                               onChange={(e) => setFormData({...formData, active: e.target.checked})}
                               className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                         </label>
                      </div>
                   </form>

                   <div className="p-6 bg-muted/10 border-t border-border/40 flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2">
                         {t("profile_page.cancel")}
                      </Button>
                      <Button onClick={handleSubmit} className="flex-[1.5] h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10">
                         <Save className="mr-2" size={16} />
                         {editingBanner ? t("common.save_changes").toUpperCase() : t("admin.banners.add_submit").toUpperCase()}
                      </Button>
                   </div>
                </motion.div>
             </div>
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
