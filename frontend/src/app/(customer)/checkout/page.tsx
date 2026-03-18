"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, CheckCircle, MapPin, ClipboardList, Package, ShoppingBag } from "lucide-react";
import axios from "axios";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";

interface Address { id: number; address_line_1: string; city: string; country: string; is_default: boolean }

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  
  const PAYMENT_METHODS = [
    { value: "cod",           label: t("checkout_page.payment_methods.cod"),  emoji: "💵" },
    { value: "bank_transfer", label: t("checkout_page.payment_methods.bank_transfer"),      emoji: "🏦" },
    { value: "momo",          label: t("checkout_page.payment_methods.momo"),        emoji: "📱" },
    { value: "vnpay",         label: t("checkout_page.payment_methods.vnpay"),              emoji: "💳" },
  ];

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("cod");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    if (items.length === 0 && !success) { router.replace("/cart"); return; }
    
    setIsInitialLoading(true);
    axios.get(`${API}/profile/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { 
        setAddresses(r.data); 
        const def = r.data.find((a: Address) => a.is_default); 
        if (def) setSelectedAddr(def.id); 
      })
      .catch(() => {})
      .finally(() => setIsInitialLoading(false));
  }, [token, items.length, router, API, success]);

  const subtotal = totalPrice();
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total    = subtotal + shipping;

  const bySeller = items.reduce<Record<number, typeof items>>((acc, item) => {
    if (!acc[item.sellerId]) acc[item.sellerId] = [];
    acc[item.sellerId].push(item);
    return acc;
  }, {});

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { alert(t("checkout_page.alert_select_address")); return; }
    setLoading(true);
    try {
      await Promise.all(
        Object.entries(bySeller).map(([sellerId, sellerItems]) =>
          axios.post(`${API}/orders`, {
            seller_id: Number(sellerId),
            shipping_address_id: selectedAddr,
            payment_method: payMethod,
            notes: note,
            items: sellerItems.map((i) => ({ 
              product_id: i.productId, 
              quantity: i.quantity, 
              unit_price: i.salePrice ?? i.price,
              selected_options: i.attributes,
              variant_ids: i.variantIds
            })),
          }, { headers: { Authorization: `Bearer ${token}` } })
        )
      );
      clearCart();
      setSuccess(true);
      setTimeout(() => router.push("/orders"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message ?? "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return null;

  if (success) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 gap-6 text-center animate-in zoom-in duration-300">
      <div className="w-24 h-24 border-4 border-primary flex items-center justify-center rotate-6 bg-primary/10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CheckCircle size={56} strokeWidth={3} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">{t("checkout_page.order_success")}</h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("checkout_page.redirecting")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500 pb-20">
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-[100] bg-background border-b-2 border-primary flex h-[74px] items-stretch">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex items-center justify-center font-black text-sm uppercase tracking-[0.2em]">
          THANH TOÁN
        </div>
        <div className="w-14 shrink-0" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="hidden lg:flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b-4 border-primary pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ShoppingBag size={32} strokeWidth={3} className="text-primary" /> 
              THANH TOÁN
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">
              KIỂM TRA VÀ XÁC NHẬN ĐƠN HÀNG
            </p>
          </div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={14} strokeWidth={3} /> QUAY LẠI GIỎ HÀNG
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div className="space-y-8">
            {/* Shipping Address */}
            <div className="bg-card border-2 border-border p-6 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-2 border-border pb-3">
                <MapPin size={18} className="text-primary" /> 
                ĐỊA CHỈ NHẬN HÀNG
              </h2>
              {addresses.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-border text-center space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("checkout_page.no_addresses")}</p>
                  <a href="/profile" className="inline-block px-4 py-2 bg-muted border-2 border-border text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-colors">
                    {t("checkout_page.add_in_profile")}
                  </a>
                </div>
              ) : (
                <div className="grid gap-3">
                  {addresses.map((addr) => (
                    <label key={addr.id} 
                      className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all
                        ${selectedAddr === addr.id ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 -translate-x-0.5" : "border-border hover:border-muted-foreground"}`}
                    >
                      <input type="radio" name="address" checked={selectedAddr === addr.id} onChange={() => setSelectedAddr(addr.id)} className="mt-1 accent-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight leading-tight mb-1">{addr.address_line_1}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">{addr.city}, {addr.country}</p>
                          {addr.is_default && <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 font-black uppercase">{t("profile_page.default")}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card border-2 border-border p-6 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 border-b-2 border-border pb-3">
                <Package size={18} className="text-primary" /> 
                PHƯƠNG THỨC THANH TOÁN
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.value} 
                    className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all
                      ${payMethod === m.value ? "border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-border hover:border-muted-foreground"}`}
                  >
                    <input type="radio" name="payment" value={m.value} checked={payMethod === m.value} onChange={() => setPayMethod(m.value)} className="accent-primary" />
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="bg-card border-2 border-border p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ClipboardList size={18} className="text-primary" /> 
                {t("checkout_page.order_notes")}
              </h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder={t("checkout_page.notes_placeholder")}
                className="w-full px-4 py-3 bg-muted border-2 border-border text-xs font-bold uppercase placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-card border-4 border-primary p-6 space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tighter border-b-2 border-primary pb-3">
                {t("cart_page.summary")}
              </h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border-b-2 border-border pb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white border-2 border-border p-1 shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase line-clamp-1">{item.title}</p>
                      <p className="text-[9px] font-black text-primary">x{item.quantity}</p>
                    </div>
                    <p className="text-[10px] font-black shrink-0">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{t("cart_page.subtotal")}</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{t("cart_page.shipping")}</span>
                  <span className={!shipping ? "text-green-600 font-black" : "text-foreground"}>
                    {shipping ? formatPrice(shipping) : "MIỄN PHÍ"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-tighter">Tổng thanh toán</span>
                <span className="text-2xl font-black text-primary tracking-tighter">{formatPrice(total)}</span>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading}
                className="w-full py-4 bg-primary text-white border-2 border-primary font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>ĐẶT HÀNG NGAY <CreditCard size={18} strokeWidth={3} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
