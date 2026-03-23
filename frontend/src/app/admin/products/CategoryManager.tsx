"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Search, Plus, Edit2, Trash2, ChevronRight, 
  ChevronDown, Folder, Save, AlertCircle 
} from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  products_count?: number;
  children?: Category[];
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  api: string;
}

export default function CategoryManager({ isOpen, onClose, token, api }: CategoryManagerProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  
  // Edit/Create state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCategories = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${api}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, token]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (id?: number) => {
    if (!editName) return;
    try {
      if (id) {
        await axios.put(`${api}/admin/categories/${id}`, 
          { name: editName, parent_id: editParentId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${api}/admin/categories`, 
          { name: editName, parent_id: editParentId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setEditingId(null);
      setIsCreating(false);
      setEditName("");
      setEditParentId(null);
      if (editParentId) {
        setExpanded(prev => ({ ...prev, [editParentId]: true }));
      }
      fetchCategories();
    } catch (err: any) {
      console.error("Save category error:", err.response?.data);
      alert(err.response?.data?.message || t("admin.banners.save_error"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${api}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingId(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || t("admin.banners.delete_error"));
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchSelf = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchChildren = cat.children?.some(child => child.name.toLowerCase().includes(search.toLowerCase()));
    return matchSelf || matchChildren;
  });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditParentId(cat.parent_id);
    setIsCreating(false);
  };

  const startCreate = (parentId: number | null = null) => {
    setIsCreating(true);
    setEditingId(null);
    setEditName("");
    setEditParentId(parentId);
    if (parentId) {
      setExpanded(prev => ({ ...prev, [parentId]: true }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            className="relative w-full max-w-2xl bg-card border-4 border-primary shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b-4 border-primary flex justify-between items-center bg-muted/50">
              <div className="flex items-center gap-3">
                <Folder className="text-primary" size={24} />
                <h2 className="text-xl font-black uppercase tracking-tight">{t("admin.banners.categories.title")}</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 border-2 border-primary hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              {/* Search & Add */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder={t("admin.banners.categories.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted/30 border-2 border-border focus:border-primary outline-none font-bold text-sm transition-all"
                  />
                </div>
                <button 
                  onClick={() => startCreate()}
                  className="px-4 py-2 bg-primary text-white font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} /> {t("admin.banners.categories.add_new")}
                </button>
              </div>

              {/* Category List */}
              <div className="space-y-4">
                {loading && categories.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase opacity-40 italic font-mono tracking-widest">{t("admin.banners.categories.loading")}</p>
                  </div>
                ) : (
                  <div className="grid gap-3 font-mono">
                    {/* Create Form */}
                    {isCreating && !editParentId && (
                      <div className="p-4 border-2 border-primary bg-primary/5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <input 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={t("admin.banners.categories.new_parent_placeholder")}
                          className="flex-1 bg-background border-2 border-border px-3 py-1.5 font-bold text-sm outline-none focus:border-primary"
                        />
                        <button onClick={() => handleSave()} className="p-1.5 bg-primary text-white hover:bg-primary/90" title={t("admin.banners.categories.save_btn")}><Save size={16} /></button>
                        <button onClick={() => setIsCreating(false)} className="p-1.5 hover:bg-muted" title={t("admin.banners.categories.cancel_btn")}><X size={16} /></button>
                      </div>
                    )}

                    {filteredCategories.map(cat => (
                      <div key={cat.id} className="space-y-2">
                        {/* Parent Item */}
                        <div className={`p-3 border-2 transition-all flex items-center justify-between gap-3 ${editingId === cat.id ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]" : "border-border hover:border-primary/50 group"}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button 
                              onClick={() => toggleExpand(cat.id)}
                              className={`p-1 rounded hover:bg-muted transition-colors ${cat.children?.length ? "visible" : "invisible"}`}
                            >
                              {expanded[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {editingId === cat.id ? (
                              <input 
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 bg-background border-2 border-primary px-2 py-0.5 font-bold text-sm outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSave(cat.id)}
                              />
                            ) : (
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-black uppercase text-xs tracking-tight">{cat.name}</span>
                                <span className="text-[9px] font-bold opacity-30 bg-muted px-1.5 py-0.5">({cat.products_count} {t("seller.orders.items")})</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {editingId === cat.id ? (
                              <>
                                <button onClick={() => handleSave(cat.id)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title={t("admin.banners.categories.save_btn")}><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded" title={t("admin.banners.categories.cancel_btn")}><X size={16} /></button>
                              </>
                            ) : deletingId === cat.id ? (
                                <div className="flex items-center gap-1 animate-in zoom-in-50">
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        className="h-8 px-3 bg-red-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-600"
                                    >
                                        {t("admin.banners.categories.delete_confirm")}
                                    </button>
                                    <button 
                                        onClick={() => setDeletingId(null)}
                                        className="h-8 px-3 bg-muted text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-muted/80"
                                    >
                                        {t("admin.banners.categories.delete_cancel")}
                                    </button>
                                </div>
                            ) : (
                              <>
                                <button onClick={() => startCreate(cat.id)} className="p-1.5 text-primary hover:bg-primary/10 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity" title={t("admin.banners.categories.add_child_hint")}><Plus size={16} /></button>
                                <button onClick={() => startEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity" title={t("admin.banners.categories.edit_hint")}><Edit2 size={16} /></button>
                                <button onClick={() => setDeletingId(cat.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity" title={t("admin.banners.categories.delete_hint_btn")}><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Children */}
                        {(expanded[cat.id] || search) && (
                          <div className="ml-8 border-l-2 border-primary/20 pl-4 space-y-2">
                             {/* Create Child Form */}
                             {isCreating && editParentId === cat.id && (
                               <div className="p-2 border-2 border-dashed border-primary flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                 <input 
                                   autoFocus
                                   value={editName}
                                   onChange={(e) => setEditName(e.target.value)}
                                   placeholder={t("admin.banners.categories.new_child_placeholder")}
                                   className="flex-1 bg-background border-2 border-border px-3 py-1 font-bold text-xs outline-none focus:border-primary"
                                 />
                                 <button onClick={() => handleSave()} className="p-1 bg-primary text-white" title={t("admin.banners.categories.save_btn")}><Save size={14} /></button>
                                 <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-muted" title={t("admin.banners.categories.cancel_btn")}><X size={14} /></button>
                               </div>
                             )}

                             {cat.children?.filter(child => child.name.toLowerCase().includes(search.toLowerCase())).map(child => (
                               <div key={child.id} className={`p-2 border-2 transition-all flex items-center justify-between gap-3 ${editingId === child.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 group bg-muted/10"}`}>
                                 <div className="flex-1 min-w-0">
                                   {editingId === child.id ? (
                                     <input 
                                       autoFocus
                                       value={editName}
                                       onChange={(e) => setEditName(e.target.value)}
                                       className="w-full bg-background border-2 border-primary px-2 py-0.5 font-bold text-xs outline-none"
                                       onKeyDown={(e) => e.key === 'Enter' && handleSave(child.id)}
                                     />
                                   ) : (
                                     <div className="flex items-center gap-2 truncate">
                                       <span className="font-bold text-xs">{child.name}</span>
                                       <span className="text-[9px] font-bold opacity-30">({child.products_count} {t("seller.orders.items")})</span>
                                     </div>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-1 shrink-0">
                                   {editingId === child.id ? (
                                      <>
                                        <button onClick={() => handleSave(child.id)} className="p-1 text-primary hover:bg-primary/10 rounded" title={t("admin.banners.categories.save_btn")}><Save size={14} /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded" title={t("admin.banners.categories.cancel_btn")}><X size={14} /></button>
                                      </>
                                   ) : deletingId === child.id ? (
                                        <div className="flex items-center gap-1 animate-in zoom-in-50">
                                            <button 
                                                onClick={() => handleDelete(child.id)}
                                                className="h-6 px-2 bg-red-500 text-white font-black uppercase text-[8px] tracking-widest hover:bg-red-600"
                                            >
                                                {t("admin.banners.categories.delete_confirm")}
                                            </button>
                                            <button 
                                                onClick={() => setDeletingId(null)}
                                                className="h-8 px-3 bg-muted text-foreground font-black uppercase text-[10px] tracking-widest hover:bg-muted/80"
                                            >
                                                {t("admin.banners.categories.delete_cancel")}
                                            </button>
                                        </div>
                                   ) : (
                                      <>
                                        <button onClick={() => startEdit(child)} className="p-1 text-blue-500 hover:bg-blue-500/10 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity" title={t("admin.banners.categories.edit_hint")}><Edit2 size={14} /></button>
                                        <button onClick={() => setDeletingId(child.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity" title={t("admin.banners.categories.delete_hint_btn")}><Trash2 size={14} /></button>
                                      </>
                                   )}
                                 </div>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-border bg-muted/20 flex items-center gap-3">
               <AlertCircle size={16} className="text-muted-foreground shrink-0" />
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed text-wrap">
                 {t("admin.banners.categories.delete_hint")}
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
