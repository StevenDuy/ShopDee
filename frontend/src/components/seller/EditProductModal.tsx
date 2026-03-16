"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X, Save, Upload, Trash2, Plus, ChevronDown, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";

const API = "http://localhost:8000/api";

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
};

interface Props { productId: number; onClose: () => void; onSuccess: () => void; }

const emptySubValue = (): SubValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0 });
const emptyValue = (): OptionValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0, sub_values: [] });

const formatPrice = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const str = val.toString().replace(/\D/g, "");
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export function EditProductModal({ productId, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);

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
    }).catch(err => {
      console.error(err);
      setError("Failed to load product.");
    }).finally(() => setLoading(false));
  }, [productId, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (formData) setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
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

  const addOption = () => setOpts(p => [...p, { option_name: "", values: [emptyValue(), emptyValue()] }]);
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
    const allowedExtensions = ["jpeg", "png", "jpg", "gif", "mp4", "webm"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of filesToValidate) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        return `File "${file.name}" không đúng định dạng. Chỉ chấp nhận: ${allowedExtensions.join(", ")}`;
      }
      if (file.size > maxSize) {
        return `File "${file.name}" quá lớn. Tối đa 10MB.`;
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
        setError("Vui lòng nhập giá và số lượng hoặc thêm các tùy chọn sản phẩm.");
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
      }, { headers: { Authorization: `Bearer ${token}` } });

      for (const file of newFiles) {
        const fd = new FormData();
        fd.append("file", file);
        await axios.post(`${API}/seller/products/${productId}/media`, fd, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
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
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">{t("seller.products_manage.edit_product")}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted text-muted-foreground rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-product-form" onSubmit={handleSave} className="space-y-6">
            {error && <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t("seller.products_manage.product_title")}</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t("seller.products_manage.description")}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">{t("seller.products_manage.category")}</label>
                  <button type="button" onClick={() => setShowAddCategory(true)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={10} /> {t("seller.products_manage.new")}</button>
                </div>
                <div className="relative">
                  <select name="category_id" value={formData.category_id} onChange={handleChange} required
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 pr-8">
                    <option value="">{t("seller.products_manage.select_category")}</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>{cat.name}</option>
                        {cat.children?.map(ch => <option key={ch.id} value={ch.id}>-- {ch.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("seller.orders.status")}</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="active">{t("seller.orders.status_processing")}</option>
                  <option value="inactive">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("seller.products_manage.base_price")}</label>
                {options.length > 0 ? (
                  <div className="w-full px-3 py-2 bg-muted border border-dashed border-border rounded-xl text-sm font-medium">
                    <span className="text-muted-foreground">{t("seller.products_manage.cheapest_price")}: </span>
                    <span className="text-primary">
                      {(() => {
                        let min = Infinity;
                        options.forEach(o => o.values.forEach(v => {
                          const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
                          if (hasSubs) {
                            v.sub_values.forEach(s => { if (s.option_value.trim() && s.price_adjustment < min) min = s.price_adjustment; });
                          } else {
                            if (v.option_value.trim() && v.price_adjustment < min) min = v.price_adjustment;
                          }
                        }));
                        return min === Infinity ? `0 ${t("currency_code")}` : new Intl.NumberFormat(t("locale"), { style: 'currency', currency: t("currency_code") }).format(min);
                      })()}
                      </span>
                  </div>
                ) : (
                  <input type="text" name="price" value={formatPrice(formData.price)} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, "");
                      if (!isNaN(Number(raw)) || raw === "") {
                        setFormData({ ...formData, price: raw });
                      }
                    }}
                    required
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("seller.products_manage.stock")}</label>
                {options.length > 0 ? (
                  <div className="w-full px-3 py-2 bg-muted border border-dashed border-border rounded-xl text-sm">
                    <span className="text-muted-foreground">{t("seller.products_manage.total_from_options")} </span>
                    <span className="font-bold text-foreground">
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
                    className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                )}
              </div>
            </div>

            <hr className="border-border" />

            {/* Media */}
            <div>
              <h3 className="text-sm font-bold mb-3">{t("seller.products_manage.media")}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 pt-3 pl-3">
                {formData.media?.map(m => (
                  <div key={m.id} className="relative aspect-square border border-border rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.full_url} alt="" className="object-cover w-full h-full" />
                    <button type="button" onClick={() => deleteExistingMedia(m.id)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                    {m.is_primary && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] uppercase font-bold rounded-sm">Primary</span>}
                  </div>
                ))}
                {newFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative aspect-square border-2 border-primary/50 rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full opacity-70" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/30">NEW</span>
                    <button type="button" onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
                <label className="aspect-square border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors group">
                  <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                  <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors mb-1">
                    <Upload size={14} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-primary">{t("seller.products_manage.add_media")}</span>
                </label>
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
                    <div className="flex items-center gap-2">
                      <input type="text" value={opt.option_name} onChange={e => updateOptionName(oi, e.target.value)}
                        placeholder={t("seller.products_manage.option_name_placeholder")} className="w-36 shrink-0 px-2 py-1.5 bg-input border border-border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <div className="flex-1 text-xs text-muted-foreground">{t("seller.products_manage.min_2_values")}</div>
                      {/* Option total stock badge */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Tổng stock = SUM tất cả values">
                        <span className="text-[10px] uppercase tracking-wide">{t("seller.products_manage.total")}:</span>
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded text-[11px]">{computedOptionStock(opt)}</span>
                      </div>
                      <button type="button" onClick={() => removeOption(oi)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><X size={14} /></button>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_90px_65px_auto] gap-1.5 text-[11px] font-medium text-muted-foreground px-0.5">
                      <span>{t("seller.products_manage.product")}</span><span>{t("seller.products_manage.price")} (VNĐ)</span><span>{t("seller.products_manage.inventory")}</span><span className="flex gap-1"><span className="w-5 inline-block" /><span className="w-5 inline-block" /></span>
                    </div>

                    <div className="space-y-3">
                      {opt.values.map((val, vi) => {
                        const hasSubs = val.sub_values.some(s => s.option_value.trim() !== '');
                        const parentStock = computedParentStock(val);
                        return (
                          <div key={vi} className="space-y-1.5">
                            {/* Parent value */}
                            <div className="grid grid-cols-[1fr_90px_65px_auto] gap-1.5 items-center">
                              <input type="text" value={val.option_value} onChange={e => updateValue(oi, vi, "option_value", e.target.value)}
                                placeholder={t("seller.products_manage.value_placeholder")} className="px-2 py-1.5 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />

                              {/* Price: readonly khi có sub_values */}
                              {hasSubs ? (
                                <div className="px-2 py-1.5 bg-muted border border-dashed border-border rounded-lg text-[10px] text-muted-foreground text-center" title="Tính từ option con">
                                  {t("seller.products_manage.from_sub")}
                                </div>
                              ) : (
                                <input type="text" value={formatPrice(val.price_adjustment)}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\./g, "");
                                    if (!isNaN(Number(raw)) || raw === "") {
                                      updateValue(oi, vi, "price_adjustment", parseFloat(raw) || 0);
                                    }
                                  }}
                                  className="px-2 py-1.5 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
                              )}

                              {/* Stock: computed khi có sub_values */}
                              {hasSubs ? (
                                <div className="px-2 py-1.5 bg-muted border border-dashed border-border rounded-lg text-xs font-bold text-center" title="Tự động = MIN(stock sub)">
                                  {parentStock}
                                </div>
                              ) : (
                                <input type="number" value={val.stock_quantity} min="0" onChange={e => updateValue(oi, vi, "stock_quantity", parseInt(e.target.value) || 0)}
                                  className="px-2 py-1.5 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
                              )}

                              <div className="flex gap-1">
                                <button type="button" onClick={() => addSubValue(oi, vi)} title="Thêm sub-values"
                                  className="w-5 h-5 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                                  <Plus size={11} />
                                </button>
                                <button type="button" onClick={() => removeValue(oi, vi)} disabled={opt.values.length <= 2}
                                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30">
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                            {/* Sub-values */}
                            {val.sub_values.map((sub, si) => (
                              <div key={si} className="grid grid-cols-[12px_1fr_90px_65px_auto] gap-1.5 items-center pl-1">
                                <div className="flex items-center">
                                  <div className="w-px h-3 bg-border opacity-50 mx-auto" />
                                </div>
                                <input type="text" value={sub.option_value} onChange={e => updateSubValue(oi, vi, si, "option_value", e.target.value)}
                                  placeholder={t("seller.products_manage.sub_value_placeholder")} className="px-2 py-1 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                                <input type="text" value={formatPrice(sub.price_adjustment)}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\./g, "");
                                    if (!isNaN(Number(raw)) || raw === "") {
                                      updateSubValue(oi, vi, si, "price_adjustment", parseFloat(raw) || 0);
                                    }
                                  }}
                                  className="px-2 py-1 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                                <input type="number" value={sub.stock_quantity} min="0" onChange={e => updateSubValue(oi, vi, si, "stock_quantity", parseInt(e.target.value) || 0)}
                                  className="px-2 py-1 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                                <button type="button" onClick={() => removeSubValue(oi, vi, si)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                  <X size={10} />
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
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {!confirmDelete ? (
            <button type="button" onClick={() => { setError(null); setConfirmDelete(true); }} disabled={saving || deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
              <Trash2 size={16} /> Delete Product
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
              <AlertTriangle size={16} className="text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive">Delete permanently?</span>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-3 py-1 bg-destructive text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}
                className="px-3 py-1 border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={saving || deleting}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">{t("inbox.cancel")}</button>
            <button type="submit" form="edit-product-form" disabled={saving || deleting}
              className="bg-primary text-primary-foreground flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {t("seller.products_manage.save")}
            </button>
          </div>
        </div>
      </div>

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
                <option value="">None</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowAddCategory(false); setAddCategoryError(null); }}
                className="flex-1 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">{t("profile_page.cancel")}</button>
              <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}
                className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {addingCategory ? t("loading") : t("inbox.unified_title") === "Hộp thư Hợp nhất" ? "Thêm" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
