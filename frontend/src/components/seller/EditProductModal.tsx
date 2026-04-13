"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {  Package, Save, X, Plus, Trash2, Check,
  Upload, Image as ImageIcon, CheckCircle2, 
  AlertCircle, ChevronRight, Info, Zap, Box, Edit, ChevronDown, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { EliteCombobox } from "@/components/ui/elite-combobox";
import { useTranslation } from "react-i18next";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Category = { id: number; name: string; children: Category[] };
type ProductMedia = { id: number; url: string; full_url: string; is_primary: boolean };

type SubValue = { option_value: string; price_adjustment: number; stock_quantity: number };
type OptionValue = {
  id?: number;
  option_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sub_values: SubValue[]; // max 2
};
type ProductOption = { id?: number; option_name: string; values: OptionValue[] };

type Product = {
  id: number; title: string; price: string | number;
  stock_quantity: string | number; status: string;
  category_id: number; description: string; media: ProductMedia[];
  ban_reason?: string | null;
};

interface Props { productId: number; onClose: () => void; onSuccess: () => void; }

const emptySubValue = (): SubValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0 });
const emptyValue = (): OptionValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0, sub_values: [] });


export function EditProductModal({ productId, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { formatPrice, fromBaseCurrency, toBaseCurrency } = useCurrencyStore();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [primaryRef, setPrimaryRef] = useState<{ type: 'existing' | 'new', id?: number, index?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [attributes, setAttributes] = useState<{ attribute_name: string; attribute_value: string }[]>([]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      axios.get(`${API}/products/categories`),
      axios.get(`${API}/seller/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/seller/products/${productId}/options`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([catRes, prodRes, optRes]) => {
      setCategories(catRes.data || []);
      setFormData(prodRes.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: ProductOption[] = (optRes.data || []).map((o: any) => ({
        id: o.id,
        option_name: o.option_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values: (o.values || []).map((v: any) => ({
          id: v.id,
          option_value: v.option_value,
          price_adjustment: parseFloat(v.price_adjustment) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sub_values: (v.sub_values || []).map((s: any) => ({
            option_value: s.option_value,
            price_adjustment: parseFloat(s.price_adjustment) || 0,
            stock_quantity: parseInt(s.stock_quantity) || 0,
          })),
        })),
      }));
      setOptions(mapped);
      setAttributes(prodRes.data.attributes || []);
    }).catch(err => {
      console.error(err);
      setError("Failed to load product.");
    }).finally(() => setLoading(false));
  }, [productId, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (formData) setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (e.target.value) {
      e.target.value = "";
    }
  };

  const deleteExistingMedia = async (mediaId: number) => {
    if (!token || !formData) return;
    try {
      await axios.delete(`${API}/seller/products/${productId}/media/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, media: formData.media.filter(m => m.id !== mediaId) });
    } catch (err) { console.error("Delete media failed", err); }
  };

  // ── Options helpers ────────────────────────────────────────────────
  const setOpts = (fn: (p: ProductOption[]) => ProductOption[]) => setOptions(fn);

  const addOption = () => setOpts(p => [...p, { 
    option_name: `${t("seller.products_manage.option")} ${options.length + 1}`, 
    values: [emptyValue(), emptyValue()] 
  }]);
  const removeOption = (oi: number) => setOpts(p => p.filter((_, i) => i !== oi));
  const updateOptionName = (oi: number, name: string) => setOpts(p => p.map((o, i) => i === oi ? { ...o, option_name: name } : o));
  const addValue = (oi: number) => setOpts(p => p.map((o, i) => i === oi ? { ...o, values: [...o.values, emptyValue()] } : o));
  const removeValue = (oi: number, vi: number) => setOpts(p => p.map((o, i) => i === oi ? { ...o, values: o.values.filter((_, j) => j !== vi) } : o));

  const updateValue = <K extends keyof Omit<OptionValue, "sub_values">>(oi: number, vi: number, field: K, val: OptionValue[K]) =>
    setOpts(p => p.map((o, i) => i === oi ? { ...o, values: o.values.map((v, j) => j === vi ? { ...v, [field]: val } : v) } : o));

  const addSubValue = (oi: number, vi: number) =>
    setOpts(p => p.map((o, i) => i === oi ? { ...o, values: o.values.map((v, j) => j === vi ? { ...v, sub_values: [...v.sub_values, emptySubValue(), emptySubValue()] } : v) } : o));
  const removeSubValue = (oi: number, vi: number, si: number) =>
    setOpts(p => p.map((o, i) => i === oi ? { ...o, values: o.values.map((v, j) => j === vi ? { ...v, sub_values: v.sub_values.filter((_, k) => k !== si) } : v) } : o));
  const updateSubValue = <K extends keyof SubValue>(oi: number, vi: number, si: number, field: K, val: SubValue[K]) =>
    setOpts(p => p.map((o, i) => i === oi ? { ...o, values: o.values.map((v, j) => j === vi ? { ...v, sub_values: v.sub_values.map((s, k) => k === si ? { ...s, [field]: val } : s) } : v) } : o));

  // stock value = SUM(stock sub_values có tên)
  const computedParentStock = (val: OptionValue): number => {
    const filled = val.sub_values.filter(s => s.option_value.trim() !== '');
    if (filled.length === 0) return 0;
    return filled.reduce((sum, s) => sum + s.stock_quantity, 0); // SUM
  };

  // stock option = SUM(stock tất cả values)
  const computedOptionStock = (opt: ProductOption): number =>
    opt.values.reduce((sum, v) => {
      const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
      return sum + (hasSubs ? computedParentStock(v) : v.stock_quantity);
    }, 0);

  // ── Add Category ────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true); setAddCategoryError(null);
    try {
      await axios.post(`${API}/seller/categories`, { name: newCategoryName.trim(), parent_id: newCategoryParentId || null }, { headers: { Authorization: `Bearer ${token}` } });
      setNewCategoryName(""); setNewCategoryParentId(""); setShowAddCategory(false);
      const catRes = await axios.get(`${API}/products/categories`);
      setCategories(catRes.data || []);
    } catch { setAddCategoryError("Failed to add category."); }
    finally { setAddingCategory(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true); setError(null);
    try {
      await axios.delete(`${API}/seller/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
      setConfirmDelete(false);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      setError(`[${e.response?.status ?? "?"}] ${e.response?.data?.message ?? "Failed to delete product."}`);
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validateFiles = (filesToValidate: File[]): string | null => {
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of filesToValidate) {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        return t("seller.products_manage.invalid_file", { name: file.name, exts: allowedExtensions.join(", ") });
      }
      if (file.size > maxSize) {
        return t("seller.products_manage.file_too_large", { name: file.name });
      }
    }
    return null;
  };

  // ── Save ───────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData) return;

    // 1. Kiểm tra ảnh mới
    const fileError = validateFiles(newFiles);
    if (fileError) {
      setError(fileError);
      return;
    }

    // Pre-process options
    const validOptions = options
      .filter(o => o.option_name.trim() && o.values.filter(v => v.option_value.trim()).length >= 2)
      .map(o => ({
        option_name: o.option_name.trim(),
        values: o.values.filter(v => v.option_value.trim()).map(v => {
          const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
          return {
            option_value: v.option_value.trim(),
            price_adjustment: hasSubs ? 0 : Math.max(0, Number(v.price_adjustment)),
            stock_quantity: hasSubs ? computedParentStock(v) : Math.max(0, Number(v.stock_quantity)),
            sub_values: v.sub_values
              .filter(s => s.option_value.trim() !== '')
              .map(s => ({
                option_value: s.option_value.trim(),
                price_adjustment: Math.max(0, Number(s.price_adjustment)),
                stock_quantity: Math.max(0, Number(s.stock_quantity)),
              })),
          };
        }),
      }));

    let finalPrice = parseFloat(formData.price.toString()) || 0;
    let finalStock = parseInt(formData.stock_quantity.toString()) || 0;

    if (validOptions.length > 0) {
      let minPrice = Infinity;
      let totalStock = 0;

      validOptions.forEach(opt => {
        opt.values.forEach(val => {
          if (val.sub_values.length > 0) {
            val.sub_values.forEach(sub => {
              if (sub.price_adjustment < minPrice) minPrice = sub.price_adjustment;
              totalStock += sub.stock_quantity;
            });
          } else {
            if (val.price_adjustment < minPrice) minPrice = val.price_adjustment;
            totalStock += val.stock_quantity;
          }
        });
      });

      if (minPrice !== Infinity) finalPrice = minPrice;
      finalStock = totalStock;
    } else {
      if (!formData.price || !formData.stock_quantity) {
        setError(t("seller.products_manage.fill_required"));
        return;
      }
    }

    setSaving(true); setError(null);
    try {
      await axios.put(`${API}/seller/products/${productId}`, {
        title: formData.title, category_id: formData.category_id,
        price: finalPrice,
        stock_quantity: finalStock,
        description: formData.description, status: formData.status,
        attributes: attributes.filter(a => a?.attribute_name?.trim() && a?.attribute_value?.trim())
      }, { headers: { Authorization: `Bearer ${token}` } });

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const fd = new FormData();
        fd.append("file", file);
        if (primaryRef?.type === 'new' && primaryRef.index === i) {
           fd.append("is_primary", "1");
        }
        await axios.post(`${API}/seller/products/${productId}/media`, fd, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      }

      // If existing media was selected as primary
      if (primaryRef?.type === 'existing' && primaryRef.id) {
         await axios.put(`${API}/seller/products/${productId}/media/${primaryRef.id}/primary`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }

      await axios.post(`${API}/seller/products/${productId}/options/sync`, { options: validOptions }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "circOut" }}
        className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[3rem] shadow-2xl overflow-hidden border border-border/40 relative"
      >
        {/* Elite Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-border/5 shrink-0 bg-muted/10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                <Edit size={20} strokeWidth={2.5} />
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{t("seller.products_manage.edit_product")}</h2>
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-1">PRODUCT IDENTIFIER: #{productId}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-2xl text-muted-foreground transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-border/50 shadow-none"><X size={20} strokeWidth={2.5} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          {formData.status === 'banned' && (
            <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] flex items-center gap-6 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                 <AlertTriangle size={30} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="font-black uppercase text-red-600 tracking-widest text-[11px] mb-1">{t("seller.products_manage.banned")}</p>
                {formData.ban_reason && <p className="text-[13px] text-red-500/80 font-bold leading-tight">{formData.ban_reason}</p>}
                <p className="text-[10px] font-black uppercase opacity-40 tracking-wider mt-2">{t("seller.products_manage.banned_readonly_hint") || "READ-ONLY: PRODUCT VIOLATION"}</p>
              </div>
            </div>
          )}
          <form id="edit-product-form" onSubmit={handleSave} className="space-y-6">
            <fieldset disabled={formData.status === 'banned'} className="space-y-6 contents">
              {error && <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-4">{t("seller.products_manage.product_title")}</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full h-14 px-6 bg-muted/20 border-transparent rounded-[1.5rem] font-bold text-sm shadow-none focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all placeholder:opacity-30" />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-4">{t("seller.products_manage.description")}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                  className="w-full px-6 py-4 bg-muted/20 border-transparent rounded-[1.5rem] font-bold text-sm shadow-none focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all placeholder:opacity-30 min-h-[120px]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between px-4 mb-2">
                  <div className="invisible" /> {/* Spacer */}
                  <button type="button" onClick={() => setShowAddCategory(true)} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary hover:text-black transition-colors"><Plus size={12} strokeWidth={3} /> {t("seller.products_manage.new")}</button>
                </div>
                <EliteCombobox
                  label={t("seller.products_manage.category")}
                  placeholder={t("seller.products_manage.select_category")}
                  value={formData.category_id?.toString() || ""}
                  onChange={(val) => setFormData({ ...formData, category_id: parseInt(val) })}
                  options={categories.flatMap(cat => [
                    { label: cat.name.toUpperCase(), value: cat.id.toString(), searchTerms: cat.name },
                    ...(cat.children || []).map(ch => ({ 
                      label: `↳ ${ch.name}`, 
                      value: ch.id.toString(),
                      searchTerms: `${cat.name} ${ch.name}`
                    }))
                  ])}
                />
              </div>
              <div className="space-y-1">
                <EliteCombobox
                  label={t("seller.orders.status")}
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { label: t("seller.products_manage.active"), value: "active" },
                    { label: t("seller.products_manage.hide"), value: "hide" },
                    { label: t("seller.products_manage.out_of_stock"), value: "out_of_stock" },
                    ...(formData.status === 'banned' ? [{ label: t("seller.products_manage.banned"), value: "banned" }] : [])
                  ]}
                  className={formData.status === 'banned' ? "opacity-50 pointer-events-none" : ""}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-4">{t("seller.products_manage.base_price")}</label>
                {options.length > 0 ? (
                  <div className="h-14 px-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[1.5rem] flex items-center justify-between text-sm font-black overflow-hidden relative group transition-all hover:bg-primary/[0.08]">
                    <span className="text-primary/60 text-[9px] uppercase tracking-widest">{t("seller.products_manage.cheapest_price")}: </span>
                    <span className="text-primary tracking-tighter text-lg tabular-nums">
                      {(() => {
                        let minAdj = Infinity;
                        options.forEach(o => o.values.forEach(v => {
                          const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
                          if (hasSubs) {
                            v.sub_values.forEach(s => { if (s.option_value.trim() && s.price_adjustment < minAdj) minAdj = s.price_adjustment; });
                          } else {
                            if (v.option_value.trim() && v.price_adjustment < minAdj) minAdj = v.price_adjustment;
                          }
                        }));
                        const base = Number(formData.price) || 0;
                        const finalMin = minAdj === Infinity ? base : base + minAdj;
                        return formatPrice(finalMin);
                      })()}
                    </span>
                  </div>
                ) : (
                  <input type="text" name="price" value={fromBaseCurrency(Number(formData.price) || 0)} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      if (!isNaN(Number(raw)) || raw === "") {
                        setFormData({ ...formData, price: toBaseCurrency(parseFloat(raw) || 0).toString() });
                      }
                    }}
                    required
                    className="w-full h-14 px-6 bg-muted/20 border-transparent rounded-[1.5rem] font-black text-lg shadow-none focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all tabular-nums" />
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-4">{t("seller.products_manage.stock")}</label>
                {options.length > 0 ? (
                  <div className="h-14 px-6 bg-muted/20 border-2 border-dashed border-border rounded-[1.5rem] flex items-center justify-between text-sm font-black transition-all hover:bg-muted/40">
                    <span className="text-muted-foreground/60 text-[9px] uppercase tracking-widest leading-none">{t("seller.products_manage.total_from_options")} </span>
                    <span className="text-foreground tracking-tighter text-lg tabular-nums">
                      {options.reduce((total, opt) =>
                        total + opt.values.reduce((vs, v) => {
                          const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
                          return vs + (hasSubs
                            ? v.sub_values.filter(s => s.option_value.trim() !== '').reduce((ss, s) => ss + s.stock_quantity, 0)
                            : v.stock_quantity);
                        }, 0), 0)}
                    </span>
                  </div>
                ) : (
                  <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required min="0"
                    className="w-full h-14 px-6 bg-muted/20 border-transparent rounded-[1.5rem] font-black text-lg shadow-none focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all tabular-nums" />
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Media Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <ImageIcon size={18} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-base font-black uppercase tracking-tight">{t("seller.products_manage.media")}</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6 pt-2">
                 {formData.media?.map(m => {
                    const isPrimary = primaryRef?.type === 'existing' ? primaryRef.id === m.id : m.is_primary && !primaryRef;
                    return (
                      <div key={m.id} 
                        className={cn(
                          "relative aspect-square border-2 rounded-[1.2rem] overflow-hidden group shadow-sm transition-all",
                          isPrimary ? "border-primary ring-2 ring-primary/20" : "border-border/40 hover:border-primary/50"
                        )}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.full_url} alt="" className="object-cover w-full h-full" />
                        
                        {/* Delete Button */}
                        <button type="button" onClick={() => deleteExistingMedia(m.id)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-red-700">
                          <Trash2 size={12} strokeWidth={3} />
                        </button>

                        {/* Set Primary Button */}
                        <button type="button" onClick={() => setPrimaryRef({ type: 'existing', id: m.id })}
                          className={cn(
                            "absolute top-1.5 left-1.5 p-1.5 rounded-lg transition-all z-20 shadow-lg",
                            isPrimary 
                              ? "bg-primary text-primary-foreground opacity-100 scale-110" 
                              : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-primary"
                          )}>
                          <Check size={12} strokeWidth={4} />
                        </button>

                        {isPrimary && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-primary/95 text-primary-foreground text-[7px] tracking-widest font-black uppercase rounded shadow-sm backdrop-blur-sm z-10">
                              {t("seller.products_manage.primary")}
                          </div>
                        )}
                      </div>
                    );
                 })}
                 {newFiles.map((file, i) => {
                    const isPrimary = primaryRef?.type === 'new' && primaryRef.index === i;
                    return (
                      <div key={`new-${i}`} 
                        className={cn(
                           "relative aspect-square border-2 rounded-[1.2rem] overflow-hidden group shadow-inner transition-all",
                           isPrimary ? "border-primary ring-2 ring-primary/20" : "border-primary/20 bg-primary/5 hover:border-primary/50"
                        )}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-widest text-primary bg-primary/10 text-center px-1 uppercase">{t("seller.products_manage.new")}</div>
                        
                        {/* Delete Button */}
                        <button type="button" onClick={() => {
                              setNewFiles(prev => prev.filter((_, idx) => idx !== i));
                              if (primaryRef?.type === 'new' && primaryRef.index === i) setPrimaryRef(null);
                           }}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-red-700">
                          <Trash2 size={12} strokeWidth={3} />
                        </button>

                        {/* Set Primary Button */}
                        <button type="button" onClick={() => setPrimaryRef({ type: 'new', index: i })}
                          className={cn(
                            "absolute top-1.5 left-1.5 p-1.5 rounded-lg transition-all z-20 shadow-lg",
                            isPrimary 
                              ? "bg-primary text-primary-foreground opacity-100 scale-110" 
                              : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-primary"
                          )}>
                          <Check size={12} strokeWidth={4} />
                        </button>

                        {isPrimary && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-primary/95 text-primary-foreground text-[7px] tracking-widest font-black uppercase rounded shadow-sm backdrop-blur-sm z-10">
                              {t("seller.products_manage.primary")}
                          </div>
                        )}
                      </div>
                    );
                 })}
                <label className="aspect-square border-2 border-dashed border-border rounded-[1.2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group relative overflow-hidden active:scale-95">
                  <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors mb-2 relative z-10">
                    <Upload size={20} className="text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors relative z-10">{t("seller.products_manage.add_media")}</span>
                </label>
              </div>
            </div>

            <hr className="border-border" />

            {/* Product Specifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">{t("seller.products_manage.specifications")}</h3>
                <button type="button" onClick={() => setAttributes([...attributes, { attribute_name: "", attribute_value: "" }])}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> {t("seller.products_manage.add_specification")}</button>
              </div>

              {attributes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed border-border rounded-xl">
                  {t("product_details.updating_data")}
                </div>
              )}

              <div className="space-y-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start p-3 bg-muted/20 border border-border rounded-xl relative">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground sm:hidden">{t("seller.products_manage.spec_name")}</label>
                      <input type="text" placeholder={t("seller.products_manage.spec_name_placeholder")} value={attr.attribute_name}
                        onChange={(e) => {
                          const newAttrs = [...attributes];
                          newAttrs[idx].attribute_name = e.target.value;
                          setAttributes(newAttrs);
                        }}
                        className="w-full px-3 py-1.5 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground sm:hidden">{t("seller.products_manage.spec_value")}</label>
                      <input type="text" placeholder={t("seller.products_manage.spec_value_placeholder")} value={attr.attribute_value}
                        onChange={(e) => {
                          const newAttrs = [...attributes];
                          newAttrs[idx].attribute_value = e.target.value;
                          setAttributes(newAttrs);
                        }}
                        className="w-full px-3 py-1.5 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <button type="button" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 sm:static p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">{t("seller.products_manage.product_options")}</h3>
                <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> {t("seller.products_manage.add_option")}</button>
              </div>

              {options.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed border-border rounded-xl">
                  {t("seller.products_manage.no_options_hint")}
                </div>
              )}

              <div className="space-y-5">
                {options.map((opt, oi) => (
                  <div key={oi} className="border border-border rounded-xl p-3 space-y-3 bg-muted/20">
                    {/* Option name row */}
                    <div className="flex items-center justify-between gap-3 bg-card/60 p-3 border-b border-border -mx-3 -mt-3 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{opt.option_name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("seller.products_manage.min_2_values")}</div>
                        
                        <div className="flex items-center gap-2">
                          {/* Option total stock badge */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl" title={t("seller.products_manage.total_stock_hint")}>
                            <Box size={14} className="text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t("seller.products_manage.total")}:</span>
                            <span className="text-xs font-black text-primary">{computedOptionStock(opt)}</span>
                          </div>
                          
                          <button type="button" onClick={() => removeOption(oi)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/20" title="Remove entire option group">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Column headers (Hidden on Mobile) */}
                    <div className="hidden sm:grid grid-cols-[1fr_120px_80px_auto] gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                      <span>{t("seller.products_manage.option_name").toUpperCase()}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-widest border border-primary/10">
                        + {t("seller.products_manage.price")} ({t("currency_code")})
                      </span>
                      <span className="text-center">{t("seller.products_manage.inventory")}</span>
                      <span className="w-[70px]"></span>
                    </div>

                    <div className="space-y-3">
                      {opt.values.map((val, vi) => {
                        const hasSubs = val.sub_values.some(s => s.option_value.trim() !== '');
                        const parentStock = computedParentStock(val);
                        return (
                          <div key={vi} className="space-y-1.5">
                            {/* Parent value */}
                            <div className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_80px_auto] gap-3 p-3 bg-card border border-border rounded-xl group relative">
                              {/* Input: Name */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.spec_name")}</label>
                                <input type="text" value={val.option_value} onChange={e => updateValue(oi, vi, "option_value", e.target.value)}
                                  placeholder={t("seller.products_manage.value_placeholder")} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                              </div>

                              <div className="grid grid-cols-2 sm:contents gap-3">
                                  {/* Price: readonly khi có sub_values */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.price")}</label>
                                    {hasSubs ? (
                                      <div className="h-[38px] px-3 flex items-center justify-center bg-muted border border-dashed border-border rounded-lg text-[9px] text-muted-foreground font-bold italic text-center" title={t("seller.products_manage.sub_option_hint")}>
                                          AUTO CALC
                                      </div>
                                    ) : (
                                      <input type="text" value={fromBaseCurrency(val.price_adjustment)}
                                        onChange={e => {
                                          const raw = e.target.value.replace(/[^\d.]/g, "");
                                          if (!isNaN(Number(raw)) || raw === "") {
                                            updateValue(oi, vi, "price_adjustment", toBaseCurrency(parseFloat(raw) || 0));
                                          }
                                        }}
                                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold" />
                                    )}
                                  </div>

                                  {/* Stock: computed khi có sub_values */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.inventory")}</label>
                                    {hasSubs ? (
                                      <div className="h-[38px] px-3 flex items-center justify-center bg-muted border border-dashed border-border rounded-lg text-xs font-black text-primary text-center" title={t("seller.products_manage.auto_stock_hint")}>
                                          <Zap size={14} className="fill-primary" />
                                      </div>
                                    ) : (
                                      <input type="number" value={val.stock_quantity} min="0" onChange={e => updateValue(oi, vi, "stock_quantity", parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold" />
                                    )}
                                  </div>
                              </div>

                               <div className="flex sm:static items-center justify-center gap-2 shrink-0 self-center sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                <button type="button" onClick={() => addSubValue(oi, vi)} title={t("seller.products_manage.add_sub_variant")}
                                  className="w-full h-8 border border-dashed border-primary/30 rounded-lg flex items-center justify-center text-primary/60 hover:bg-primary/5 hover:border-primary transition-all mt-2"
                                >
                                  <Plus size={16} />
                                </button>
                                <button type="button" onClick={() => removeValue(oi, vi)} disabled={opt.values.length <= 2}
                                  className="flex-1 sm:flex-none sm:w-8 h-8 flex items-center justify-center bg-muted text-muted-foreground hover:bg-destructive hover:text-white rounded-lg transition-all disabled:opacity-30">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {/* Sub-values (indented nested style) */}
                            {val.sub_values.map((sub, si) => (
                              <div key={si} className="flex flex-col sm:grid sm:grid-cols-[20px_1fr_120px_80px_auto] gap-2 items-stretch sm:items-center px-3 pl-4 sm:pl-2 py-2 border-l-2 border-primary bg-primary/[0.03] rounded-r-xl my-1 relative">
                                <div className="hidden sm:flex items-center justify-center">
                                  <div className="w-px h-3 bg-primary/30 mr-0.5" />
                                  <div className="w-2 h-px bg-primary/30" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.sub_value")}</label>
                                  <input type="text" value={sub.option_value} onChange={e => updateSubValue(oi, vi, si, "option_value", e.target.value)}
                                    placeholder={t("seller.products_manage.sub_value_placeholder")} className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 font-bold" />
                                </div>

                                <div className="grid grid-cols-2 sm:contents gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.price")}</label>
                                      <input type="text" value={fromBaseCurrency(sub.price_adjustment)}
                                        onChange={e => {
                                          const raw = e.target.value.replace(/[^\d.]/g, "");
                                          if (!isNaN(Number(raw)) || raw === "") {
                                            updateSubValue(oi, vi, si, "price_adjustment", toBaseCurrency(parseFloat(raw) || 0));
                                          }
                                        }}
                                      className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-center font-bold" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.inventory")}</label>
                                    <input type="number" value={sub.stock_quantity} min="0" onChange={e => updateSubValue(oi, vi, si, "stock_quantity", parseInt(e.target.value) || 0)}
                                      className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-center font-bold" />
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeSubValue(oi, vi, si)}
                                  className="flex items-center justify-center w-6 h-6 sm:static sm:bg-transparent text-destructive sm:text-muted-foreground hover:bg-destructive/10 sm:hover:bg-destructive sm:hover:text-white rounded-md transition-all self-end mt-1 sm:mt-0">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <button type="button" onClick={() => addValue(oi)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus size={11} /> {t("seller.products_manage.add_value")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </fieldset>
            </form>
        </div>

        {/* Elite Footer */}
        <div className="px-10 py-8 border-t border-border/5 bg-muted/10 flex items-center justify-between gap-6 shrink-0 relative z-50">
          <div className="flex items-center gap-4">
            {!confirmDelete ? (
              <button type="button" onClick={() => { setError(null); setConfirmDelete(true); }} disabled={saving || deleting || formData.status === 'banned'}
                className="w-12 h-12 flex items-center justify-center rounded-[1.2rem] text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20 disabled:opacity-30 active:scale-95">
                <Trash2 size={20} strokeWidth={2.5} />
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2">
                  <button type="button" onClick={handleDelete} disabled={deleting}
                    className="w-10 h-10 bg-destructive text-white rounded-xl flex items-center justify-center hover:opacity-90 shadow-lg shadow-destructive/20 transition-all active:scale-95">
                    {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={18} strokeWidth={3} />}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}
                    className="w-10 h-10 bg-background border border-border/60 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-all active:scale-95">
                    <X size={18} strokeWidth={3} />
                  </button>
              </motion.div>
            )}
            <div className="h-8 w-px bg-border/40 mx-2" />
          </div>
          
          <div className="flex items-center gap-4">
            <button type="button" onClick={onClose} disabled={saving || deleting}
              className="px-8 h-12 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all disabled:opacity-30 active:scale-95">{t("inbox.cancel")}</button>
            <button type="submit" form="edit-product-form" disabled={saving || deleting || formData.status === 'banned'}
              className={cn(buttonVariants(), "h-12 px-10 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3")}>
              {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
              {t("seller.products_manage.save")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{t("seller.products_manage.add_category_title")}</h3>
              <button onClick={() => { setShowAddCategory(false); setAddCategoryError(null); }}
                className="p-1.5 hover:bg-muted rounded-full text-muted-foreground"><X size={16} /></button>
            </div>
            {addCategoryError && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl">{addCategoryError}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">{t("seller.products_manage.category_name")} <span className="text-destructive">*</span></label>
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Electronics"
                className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("seller.products_manage.parent_category")} <span className="text-muted-foreground font-normal text-xs">({t("seller.products_manage.optional")})</span></label>
              <select value={newCategoryParentId} onChange={e => setNewCategoryParentId(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">{t("seller.products_manage.none")}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowAddCategory(false); setAddCategoryError(null); }}
                className="flex-1 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">{t("profile_page.cancel")}</button>
              <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}
                className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {addingCategory ? t("seller.products_manage.adding") : t("seller.products_manage.add_category")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




