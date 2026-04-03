"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Plus, Edit2, Trash2, ChevronRight,
  ChevronDown, Folder, Save, AlertCircle, Trash
} from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-muted/40">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm group">
                    <Folder className="group-hover:scale-110 transition-transform" size={24} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">{t("admin.banners.categories.title")}</p>
                    <h2 className="text-xl font-black uppercase tracking-tight">{t("admin.banners.categories.system_directories")}</h2>
                 </div>
              </div>
              <Button variant="ghost" size="icon-lg" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-all">
                <X size={24} />
              </Button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              {/* Search & Add */}
              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder={t("admin.banners.categories.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 pl-12 bg-muted/30 border-transparent focus:border-primary rounded-2xl font-bold transition-all"
                  />
                </div>
                <Button
                  onClick={() => startCreate()}
                  className="h-12 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all px-6"
                >
                  <Plus size={18} className="mr-2" /> {t("admin.banners.categories.add_new")}
                </Button>
              </div>

              {/* Category List */}
              <div className="space-y-4">
                {loading && categories.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em]">{t("admin.banners.categories.loading")}</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {/* Create Form */}
                    {isCreating && !editParentId && (
                      <Card className="p-4 border-primary/30 bg-primary/5 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 rounded-2xl">
                        <Input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={t("admin.banners.categories.new_parent_placeholder")}
                          className="flex-1 bg-background border-border/50 h-10 rounded-xl font-bold text-sm"
                        />
                        <div className="flex gap-2">
                           <Button size="icon-sm" onClick={() => handleSave()} className="bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/10"><Save size={16} /></Button>
                           <Button size="icon-sm" variant="ghost" onClick={() => setIsCreating(false)} className="text-destructive hover:bg-destructive/10 rounded-lg"><X size={16} /></Button>
                        </div>
                      </Card>
                    )}

                    {filteredCategories.map(cat => (
                      <div key={cat.id} className="space-y-3">
                        {/* Parent Item */}
                        <Card className={cn(
                           "p-4 border shadow-sm transition-all flex items-center justify-between gap-4 rounded-2xl group/item",
                           editingId === cat.id ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-500/[0.02]" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        )}>
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => toggleExpand(cat.id)}
                              className={cn("rounded-lg", !cat.children?.length && "invisible")}
                            >
                              {expanded[cat.id] ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} />}
                            </Button>

                            {editingId === cat.id ? (
                              <Input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 bg-background border-primary h-9 rounded-xl font-bold text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleSave(cat.id)}
                              />
                            ) : (
                              <div className="flex items-center gap-3 truncate">
                                <span className="font-black uppercase text-xs tracking-tight group-hover/item:text-primary transition-colors">{cat.name}</span>
                                <span className="text-[9px] font-black bg-muted/50 px-2 py-0.5 rounded-lg border border-border/50 tracking-widest opacity-40 group-hover/item:opacity-100 transition-all uppercase">{cat.products_count} {t("seller.orders.items")}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {editingId === cat.id ? (
                              <div className="flex gap-1 animate-in zoom-in-95">
                                <Button size="icon-xs" onClick={() => handleSave(cat.id)} className="bg-emerald-600 rounded-lg"><Save size={14} /></Button>
                                <Button size="icon-xs" variant="ghost" onClick={() => setEditingId(null)} className="text-destructive hover:bg-destructive/10 rounded-lg"><X size={14} /></Button>
                              </div>
                            ) : deletingId === cat.id ? (
                              <div className="flex items-center gap-1 animate-in zoom-in-75">
                                  <Button
                                    size="xs"
                                    variant="destructive"
                                    onClick={() => handleDelete(cat.id)}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-lg px-4"
                                  >
                                    {t("admin.delete")}
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => setDeletingId(null)}
                                    className="font-black uppercase text-[10px] tracking-widest rounded-lg px-4"
                                  >
                                    {t("profile_page.cancel")}
                                  </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
                                  <Button variant="ghost" size="icon-xs" onClick={() => startCreate(cat.id)} className="text-emerald-600 hover:bg-emerald-600/10 rounded-lg" title={t("admin.banners.categories.add_child_hint")}><Plus size={16} /></Button>
                                  <Button variant="ghost" size="icon-xs" onClick={() => startEdit(cat)} className="text-blue-600 hover:bg-blue-600/10 rounded-lg" title={t("admin.banners.categories.edit_hint")}><Edit2 size={16} /></Button>
                                  <Button variant="ghost" size="icon-xs" onClick={() => setDeletingId(cat.id)} className="text-red-600 hover:bg-red-600/10 rounded-lg" title={t("admin.banners.categories.delete_hint_btn")}><Trash2 size={16} /></Button>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Children */}
                        {(expanded[cat.id] || search) && (
                          <div className="ml-10 border-l-2 border-primary/10 pl-6 space-y-3">
                            {/* Create Child Form */}
                            {isCreating && editParentId === cat.id && (
                              <Card className="p-3 border-dashed border-primary/30 bg-primary/[0.02] flex items-center gap-4 animate-in fade-in slide-in-from-left-4 rounded-2xl">
                                <Input
                                  autoFocus
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder={t("admin.banners.categories.new_child_placeholder")}
                                  className="flex-1 bg-background border-border/50 h-9 rounded-xl font-bold text-xs"
                                />
                                <div className="flex gap-1">
                                   <Button size="icon-xs" onClick={() => handleSave()} className="bg-emerald-600 rounded-lg"><Save size={14} /></Button>
                                   <Button size="icon-xs" variant="ghost" onClick={() => setIsCreating(false)} className="rounded-lg"><X size={14} /></Button>
                                </div>
                              </Card>
                            )}

                            {cat.children?.filter(child => child.name.toLowerCase().includes(search.toLowerCase())).map(child => (
                              <Card key={child.id} className={cn(
                                 "p-3 border shadow-sm transition-all flex items-center justify-between gap-4 rounded-2xl group/child",
                                 editingId === child.id ? "border-emerald-500 bg-emerald-500/[0.02]" : "border-border/50 hover:bg-muted/20"
                              )}>
                                <div className="flex-1 min-w-0">
                                  {editingId === child.id ? (
                                    <Input
                                      autoFocus
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="w-full bg-background border-primary h-8 rounded-lg font-bold text-xs"
                                      onKeyDown={(e) => e.key === 'Enter' && handleSave(child.id)}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-3 truncate">
                                      <span className="font-bold text-xs tracking-tight group-hover/child:text-primary transition-colors">{child.name}</span>
                                      <span className="text-[8px] font-black bg-muted/40 px-2 py-0.5 rounded-lg opacity-40 uppercase tracking-widest">{child.products_count} {t("seller.orders.items")}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {editingId === child.id ? (
                                    <div className="flex gap-1 animate-in zoom-in-95">
                                      <Button size="icon-xs" onClick={() => handleSave(child.id)} className="bg-emerald-600 rounded-lg"><Save size={14} /></Button>
                                      <Button size="icon-xs" variant="ghost" onClick={() => setEditingId(null)} className="rounded-lg"><X size={14} /></Button>
                                    </div>
                                  ) : deletingId === child.id ? (
                                    <div className="flex items-center gap-1 animate-in zoom-in-75">
                                      <Button
                                        size="xs"
                                        variant="destructive"
                                        onClick={() => handleDelete(child.id)}
                                        className="h-8 px-3 font-black uppercase text-[9px] tracking-widest rounded-lg"
                                      >
                                        {t("admin.delete")}
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => setDeletingId(null)}
                                        className="h-8 px-3 font-black uppercase text-[9px] tracking-widest rounded-lg"
                                      >
                                        <X size={14} />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/child:opacity-100 transition-all translate-x-1 group-hover/child:translate-x-0">
                                      <Button variant="ghost" size="icon-xs" onClick={() => startEdit(child)} className="text-blue-500 hover:bg-blue-500/10 rounded-lg" title={t("admin.banners.categories.edit_hint")}><Edit2 size={14} /></Button>
                                      <Button variant="ghost" size="icon-xs" onClick={() => setDeletingId(child.id)} className="text-red-500 hover:bg-red-500/10 rounded-lg" title={t("admin.banners.categories.delete_hint_btn")}><Trash2 size={14} /></Button>
                                    </div>
                                  )}
                                </div>
                              </Card>
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
            <div className="px-10 py-6 border-t border-border/50 bg-muted/40 flex items-center gap-4">
              <AlertCircle size={20} className="text-primary shrink-0 opacity-50" />
              <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest text-wrap opacity-60">
                {t("admin.banners.categories.delete_hint")}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
