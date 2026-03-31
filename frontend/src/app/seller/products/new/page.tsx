"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon, Trash2, Plus, X, ChevronDown } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectSeparator
} from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Category = { id: number; name: string; children: Category[] };

// ── Option types (3-level: Option → Value → SubValue) ─────────────────────
type SubValue = {
  option_value: string;
  price_adjustment: number;
  stock_quantity: number;
};

type OptionValue = {
  option_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sub_values: SubValue[]; // max 2, can be empty strings (will be skipped on save)
};

type ProductOption = {
  option_name: string;
  values: OptionValue[]; // min 2
};

const emptySubValue = (): SubValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0 });
const emptyValue = (): OptionValue => ({ option_value: "", price_adjustment: 0, stock_quantity: 0, sub_values: [] });
const emptyOption = (): ProductOption => ({ option_name: "", values: [emptyValue(), emptyValue()] });

const formatPrice = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const str = val.toString().replace(/\D/g, "");
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: "", categoryId: "", price: "", stock: "", description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product Options state
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [attributes, setAttributes] = useState<{ attribute_name: string; attribute_value: string }[]>([]);

  // Add Category modal
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  useEffect(() => { 
    fetchCategories(); 
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/products/categories`);
      setCategories(r.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };

  // ── Option helpers ─────────────────────────────────────────────────────
  const setOpts = (fn: (prev: ProductOption[]) => ProductOption[]) => setOptions(fn);

  const addOption = () => setOpts(prev => [...prev, emptyOption()]);
  const removeOption = (oi: number) => setOpts(prev => prev.filter((_, i) => i !== oi));

  const updateOptionName = (oi: number, name: string) =>
    setOpts(prev => prev.map((o, i) => i === oi ? { ...o, option_name: name } : o));

  const addValue = (oi: number) =>
    setOpts(prev => prev.map((o, i) => i === oi ? { ...o, values: [...o.values, emptyValue()] } : o));

  const removeValue = (oi: number, vi: number) =>
    setOpts(prev => prev.map((o, i) => i === oi
      ? { ...o, values: o.values.filter((_, j) => j !== vi) }
      : o));

  const updateValue = <K extends keyof Omit<OptionValue, "sub_values">>(
    oi: number, vi: number, field: K, val: OptionValue[K]
  ) => setOpts(prev => prev.map((o, i) => i === oi
    ? { ...o, values: o.values.map((v, j) => j === vi ? { ...v, [field]: val } : v) }
    : o));

  // Sub-value helpers
  const addSubValue = (oi: number, vi: number) =>
    setOpts(prev => prev.map((o, i) => i === oi
      ? {
        ...o, values: o.values.map((v, j) => j === vi
          ? { ...v, sub_values: [...v.sub_values, emptySubValue(), emptySubValue()] }
          : v)
      }
      : o));

  const removeSubValue = (oi: number, vi: number, si: number) =>
    setOpts(prev => prev.map((o, i) => i === oi
      ? {
        ...o, values: o.values.map((v, j) => j === vi
          ? { ...v, sub_values: v.sub_values.filter((_, k) => k !== si) }
          : v)
      }
      : o));

  const updateSubValue = <K extends keyof SubValue>(
    oi: number, vi: number, si: number, field: K, val: SubValue[K]
  ) => setOpts(prev => prev.map((o, i) => i === oi
    ? {
      ...o, values: o.values.map((v, j) => j === vi
        ? { ...v, sub_values: v.sub_values.map((s, k) => k === si ? { ...s, [field]: val } : s) }
        : v)
    }
    : o));

  // ── Helper: auto-compute parent stock from sub_values ────────────────
  // stock_value = SUM(stock các sub_values có tên)
  const computedParentStock = (val: OptionValue): number => {
    const filled = val.sub_values.filter(s => s.option_value.trim() !== '');
    if (filled.length === 0) return 0;
    return filled.reduce((sum: number, s: SubValue) => sum + s.stock_quantity, 0); // SUM
  };

  // stock_option = SUM(stock tất cả values)
  const computedOptionStock = (opt: ProductOption): number =>
    opt.values.reduce((sum, v) => {
      const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
      return sum + (hasSubs ? computedParentStock(v) : v.stock_quantity);
    }, 0);

  // ── Add Category ──────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true); setAddCategoryError(null);
    try {
      await axios.post(`${API}/seller/categories`,
        { name: newCategoryName.trim(), parent_id: newCategoryParentId || null },
        { headers: { Authorization: `Bearer ${token}` } });
      setNewCategoryName(""); setNewCategoryParentId(""); setShowAddCategory(false);
      fetchCategories();
    } catch { setAddCategoryError("Failed to add category."); }
    finally { setAddingCategory(false); }
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

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // 1. Kiểm tra ảnh trước
    const fileError = validateFiles(files);
    if (fileError) {
      setError(fileError);
      return;
    }

    // Pre-process valid options
    const validOptions = options
      .filter(o => o.option_name.trim() && o.values.filter(v => v.option_value.trim()).length >= 2)
      .map(o => ({
        option_name: o.option_name.trim(),
        values: o.values
          .filter(v => v.option_value.trim())
          .map(v => {
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

    let finalPrice = parseFloat(formData.price) || 0;
    let finalStock = parseInt(formData.stock) || 0;

    if (validOptions.length > 0) {
      // Logic: Lấy giá nhỏ nhất trong tất cả các option/sub-option để làm giá hiển thị
      // Và tính tổng tồn hàng
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
      // Nếu không có option, bắt buộc phải có giá và stock chính
      if (!formData.price || !formData.stock) {
        setError("Vui lòng nhập giá và số lượng hoặc thêm các tùy chọn sản phẩm.");
        return;
      }
    }

    setIsSubmitting(true); setError(null);
    let createdProductId: number | null = null;

    try {
      const res = await axios.post(`${API}/seller/products`, {
        title: formData.title, category_id: formData.categoryId,
        price: finalPrice, stock_quantity: finalStock,
        description: formData.description,
        attributes: attributes.filter(a => a?.attribute_name?.trim() && a?.attribute_value?.trim()),
      }, { headers: { Authorization: `Bearer ${token}` } });

      createdProductId = res.data.id;

      // 3. Upload files
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        let fileToUpload = files[i];

        // Compress image if it's an image
        if (fileToUpload.type.startsWith("image/")) {
          try {
            const compressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            fileToUpload = await (await import("browser-image-compression")).default(fileToUpload, compressionOptions);
          } catch (compErr) {
            console.warn("Compression failed, uploading original.", compErr);
          }
        }

        fd.append("file", fileToUpload);
        if (i === 0) fd.append("is_primary", "1");
        await axios.post(`${API}/seller/products/${createdProductId}/media`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      }

      if (validOptions.length > 0) {
        await axios.post(`${API}/seller/products/${createdProductId}/options/sync`,
          { options: validOptions },
          { headers: { Authorization: `Bearer ${token}` } });
      }

      router.push("/seller/products");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to create product");

      // CLEANUP: Nếu đã tạo sản phẩm nhưng lỗi ở bước sau (media/options), xóa sản phẩm đó
      if (createdProductId) {
        await axios.delete(`${API}/seller/products/${createdProductId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(cleanupErr => console.error("Cleanup failed", cleanupErr));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AnimatePresence>
        
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 md:p-8 max-w-5xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-4">
          <Link href="/seller/products" className="p-2 bg-card border border-border rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("seller.products_manage.add_product")}</h1>
            <p className="text-muted-foreground mt-1">{t("seller.products_manage.desc")}</p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold">{t("seller.products_manage.general_info")}</h2>
            <div>
              <label className="block text-sm font-medium mb-2">{t("seller.products_manage.product_title")} <span className="text-destructive">*</span></label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange}
                placeholder="E.g. Apple iPhone 15 Pro Max"
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("seller.products_manage.description")} <span className="text-destructive">*</span></label>
              <textarea name="description" required rows={5} value={formData.description} onChange={handleChange}
                placeholder="Detailed description of the product..."
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
            </div>
          </div>

          {/* Media */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold">{t("seller.products_manage.media")}</h2>
              <p className="text-sm text-muted-foreground">{t("seller.products_manage.upload_hint")}</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 pt-3 pl-3">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square border border-border rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  {i === 0 && <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] uppercase font-bold rounded-md">{t("seller.products_manage.primary")}</span>}
                </div>
              ))}
              <label className="aspect-square border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors group">
                <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-1 group-hover:bg-primary/10 transition-colors">
                  <Plus size={16} className="group-hover:text-primary" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-primary">{t("seller.products_manage.add_media")}</span>
              </label>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("seller.products_manage.specifications")}</h2>
              <button type="button" onClick={() => setAttributes([...attributes, { attribute_name: "", attribute_value: "" }])}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                <Plus size={16} /> {t("seller.products_manage.add_specification")}
              </button>
            </div>
            {attributes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                {t("product_details.updating_data")}
              </div>
            ) : (
              <div className="space-y-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start p-4 bg-muted/20 border border-border rounded-xl relative">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground sm:hidden">Tên thông số</label>
                      <input
                        type="text"
                        placeholder={t("seller.products_manage.spec_name_placeholder")}
                        value={attr.attribute_name}
                        onChange={(e) => {
                          const newAttrs = [...attributes];
                          newAttrs[idx].attribute_name = e.target.value;
                          setAttributes(newAttrs);
                        }}
                        className="w-full px-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground sm:hidden">Giá trị</label>
                      <input
                        type="text"
                        placeholder={t("seller.products_manage.spec_value_placeholder")}
                        value={attr.attribute_value}
                        onChange={(e) => {
                          const newAttrs = [...attributes];
                          newAttrs[idx].attribute_value = e.target.value;
                          setAttributes(newAttrs);
                        }}
                        className="w-full px-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 sm:static p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Options */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t("seller.products_manage.product_options")}</h2>
                <p className="text-sm text-muted-foreground">{t("seller.products_manage.options_hint")}</p>
              </div>
              <button type="button" onClick={addOption}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                <Plus size={16} /> {t("seller.products_manage.add_option")}
              </button>
            </div>

            {options.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                {t("seller.products_manage.no_options_hint")}
              </div>
            )}

            <div className="space-y-5">
              {options.map((opt, oi) => (
                <div key={oi} className="border border-border rounded-xl p-4 space-y-4 bg-muted/20">
                  {/* Option name row — compact */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card/60 p-3 border-b border-border -mx-4 -mt-4 rounded-t-xl">
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="text"
                        value={opt.option_name}
                        onChange={e => updateOptionName(oi, e.target.value)}
                        placeholder={t("seller.products_manage.option_name_placeholder")}
                        className="flex-1 sm:w-48 sm:shrink-0 px-3 py-2 bg-input border-2 border-primary/20 rounded-xl text-sm font-black uppercase tracking-tight focus:outline-none focus:border-primary transition-all"
                      />
                      <button type="button" onClick={() => removeOption(oi)}
                        className="sm:hidden p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors" title="Remove option">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t("seller.products_manage.min_2_values")}</div>
                      
                      <div className="flex items-center gap-3">
                        {/* Option total stock badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl" title="Tổng stock option">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t("seller.products_manage.total")}:</span>
                          <span className="text-xs font-black text-primary">{computedOptionStock(opt)}</span>
                        </div>
                        
                        <button type="button" onClick={() => removeOption(oi)}
                          className="hidden sm:flex p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors" title="Remove option">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column headers (Hidden on Mobile) */}
                  <div className="hidden sm:grid grid-cols-[1fr_120px_80px_auto] gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                    <span>{t("seller.products_manage.product")}</span>
                    <span>+ {t("seller.products_manage.price")} (VNĐ)</span>
                    <span className="text-center">{t("seller.products_manage.inventory")}</span>
                    <span className="w-[70px]"></span>
                  </div>

                  {/* Values */}
                  <div className="space-y-3">
                    {opt.values.map((val, vi) => {
                      const hasSubs = val.sub_values.some(s => s.option_value.trim() !== '');
                      const parentStock = computedParentStock(val);

                      return (
                        <div key={vi} className="space-y-1.5">
                          {/* Parent value row */}
                          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_80px_auto] gap-3 p-3 bg-card border border-border rounded-xl group relative">
                            {/* Input: Name */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.spec_name")}</label>
                              <input type="text" value={val.option_value}
                                onChange={e => updateValue(oi, vi, "option_value", e.target.value)}
                                placeholder={t("seller.products_manage.value_placeholder")}
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                            </div>

                            <div className="grid grid-cols-2 sm:contents gap-3">
                                {/* Price: ẩn khi có sub_values */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.price")}</label>
                                  {hasSubs ? (
                                    <div className="h-[38px] px-3 flex items-center justify-center bg-muted border border-dashed border-border rounded-lg text-[9px] text-muted-foreground font-bold italic text-center" title="Tính từ giá option con">
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
                                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold" />
                                  )}
                                </div>

                                {/* Stock: auto-computed khi có sub_values */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-primary/60 sm:hidden tracking-wider">{t("seller.products_manage.inventory")}</label>
                                  {hasSubs ? (
                                    <div className="h-[38px] px-3 flex items-center justify-center bg-muted border border-dashed border-border rounded-lg text-xs font-black text-primary text-center" title="Tự động = SUM(stock sub_values)">
                                      {parentStock}
                                    </div>
                                  ) : (
                                    <input type="number" value={val.stock_quantity} min="0"
                                      onChange={e => updateValue(oi, vi, "stock_quantity", parseInt(e.target.value) || 0)}
                                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-bold" />
                                  )}
                                </div>
                            </div>

                             {/* Buttons: [+ sub] [X] */}
                            <div className="flex sm:static items-center justify-center gap-2 shrink-0 self-center sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                               <button
                                 type="button"
                                 onClick={() => addSubValue(oi, vi)}
                                 title="Thêm phân loại cấp 2"
                                 className="flex-1 sm:flex-none sm:w-8 h-8 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all font-black"
                               >
                                 <Plus size={16} />
                               </button>
                               <button type="button"
                                 onClick={() => removeValue(oi, vi)}
                                 disabled={opt.values.length <= 2}
                                 title="Remove value"
                                 className="flex-1 sm:flex-none sm:w-8 h-8 flex items-center justify-center bg-muted text-muted-foreground hover:bg-destructive hover:text-white rounded-lg transition-all disabled:opacity-30">
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>

                           {/* Sub-values (indented nested style) */}
                          {val.sub_values.map((sub, si) => (
                            <div key={si} className="flex flex-col sm:grid sm:grid-cols-[20px_1fr_120px_80px_auto] gap-2 items-stretch sm:items-center px-3 pl-4 sm:pl-2 py-2 border-l-2 border-primary bg-primary/[0.03] rounded-r-xl my-1 relative">
                               <div className="hidden sm:flex items-center justify-center">
                                 <div className="w-px h-4 bg-primary/30 mr-0.5" />
                                 <div className="w-2 h-px bg-primary/30" />
                               </div>
                               
                               <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.sub_value")}</label>
                                 <input type="text" value={sub.option_value}
                                   onChange={e => updateSubValue(oi, vi, si, "option_value", e.target.value)}
                                   placeholder={t("seller.products_manage.sub_value_placeholder")}
                                   className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 font-bold" />
                               </div>

                               <div className="grid grid-cols-2 sm:contents gap-2">
                                 <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.price")}</label>
                                   <input type="text" value={formatPrice(sub.price_adjustment)}
                                     onChange={e => {
                                       const raw = e.target.value.replace(/\./g, "");
                                       if (!isNaN(Number(raw)) || raw === "") {
                                         updateSubValue(oi, vi, si, "price_adjustment", parseFloat(raw) || 0);
                                       }
                                     }}
                                     className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-center font-bold" />
                                 </div>
                                 <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase text-primary/60 sm:hidden tracking-wider px-1">{t("seller.products_manage.inventory")}</label>
                                   <input type="number" value={sub.stock_quantity} min="0"
                                     onChange={e => updateSubValue(oi, vi, si, "stock_quantity", parseInt(e.target.value) || 0)}
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

                    <button type="button" onClick={() => addValue(oi)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Plus size={11} /> {t("seller.products_manage.add_value")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("seller.products_manage.organization")}</h2>
              <button type="button" onClick={() => setShowAddCategory(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> {t("seller.products_manage.new")}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("seller.products_manage.category")} <span className="text-destructive">*</span></label>
              <div className="relative">
                <Select 
                  value={formData.categoryId?.toString() || ""} 
                  onValueChange={(val: string) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger className="w-full h-12 bg-input border border-border rounded-xl text-sm appearance-none focus:ring-2 focus:ring-primary/50 pr-10 font-bold">
                    <SelectValue placeholder={t("seller.products_manage.select_category")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl bg-card/80">
                    {categories.map(cat => (
                      <React.Fragment key={cat.id}>
                        <SelectItem value={cat.id.toString()} className="font-black uppercase text-[10px] tracking-widest bg-muted/20">
                          {cat.name.toUpperCase()}
                        </SelectItem>
                        {cat.children?.map(ch => (
                          <SelectItem key={ch.id} value={ch.id.toString()} className="font-bold text-[11px] pl-8">
                            {ch.name}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold">{t("seller.products_manage.pricing_inventory")}</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("seller.products_manage.base_price")} (VNĐ) <span className="text-destructive">*</span>
              </label>
              {options.length > 0 ? (
                <div className="w-full px-4 py-3 bg-muted border border-dashed border-border rounded-xl text-sm font-medium">
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
                <input type="text" name="price" required value={formatPrice(formData.price)} 
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    if (!isNaN(Number(raw)) || raw === "") {
                      setFormData({ ...formData, price: raw });
                    }
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("seller.products_manage.stock")} <span className="text-destructive">*</span>
              </label>
              {options.length > 0 ? (
                <div className="w-full px-4 py-3 bg-muted border border-dashed border-border rounded-xl text-sm">
                  <span className="text-muted-foreground">{t("seller.products_manage.total_from_options")} </span>
                  <span className="font-bold text-foreground">
                    {options.reduce((total, opt) => {
                      return total + opt.values.reduce((vs, v) => {
                        const hasSubs = v.sub_values.some(s => s.option_value.trim() !== '');
                        return vs + (hasSubs
                          ? v.sub_values.filter(s => s.option_value.trim() !== '').reduce((ss, s) => ss + s.stock_quantity, 0)
                          : v.stock_quantity);
                      }, 0);
                    }, 0)}
                  </span>
                </div>
              ) : (
                <input type="number" name="stock" required min="0" value={formData.stock} onChange={handleChange}
                  placeholder="100"
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">{error}</div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {isSubmitting
              ? <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              : <><Save size={18} /> {t("seller.products_manage.add_product")}</>}
          </button>
        </div>
      </form>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t("seller.products_manage.add_category_title")}</h3>
              <button onClick={() => { setShowAddCategory(false); setAddCategoryError(null); }}
                className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            {addCategoryError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">{addCategoryError}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">{t("seller.products_manage.category_name")} <span className="text-destructive">*</span></label>
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g. Electronics"
                className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("seller.products_manage.parent_category")} <span className="text-muted-foreground font-normal text-xs">({t("seller.products_manage.optional")})</span></label>
              <select value={newCategoryParentId} onChange={e => setNewCategoryParentId(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">{t("seller.products_manage.none")} ({t("seller.products_manage.top_level")})</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowAddCategory(false); setAddCategoryError(null); }}
                className="flex-1 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">{t("profile_page.cancel")}</button>
              <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {addingCategory ? t("seller.products_manage.adding") : t("seller.products_manage.add_category")}
              </button>
            </div>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}
