"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, CheckCircle, MapPin, ClipboardList, Package, ShoppingBag, Store, Wallet, Banknote, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useCart } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface Address { id: number; address_line_1: string; city: string; country: string; is_default: boolean }

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { token } = useAuthStore();
  const { formatPrice } = useCurrencyStore();

  const PAYMENT_METHODS = [
    { value: "cod",           label: t("checkout_page.payment_methods.cod"),  emoji: "💵", desc: "Pay when you receive" },
    { value: "bank_transfer", label: t("checkout_page.payment_methods.bank_transfer"),      emoji: "🏦", desc: "Direct bank transfer" },
    { value: "momo",          label: t("checkout_page.payment_methods.momo"),        emoji: "📱", desc: "MoMo E-wallet" },
    { value: "vnpay",         label: t("checkout_page.payment_methods.vnpay"),              emoji: "💳", desc: "VNPay QR/Card" },
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

  const subtotal = totalPrice;
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
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
      const orderResponses = await Promise.all(
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
          }, { headers: authHeaders })
        )
      );

      const orderIds = orderResponses.map(res => res.data.id);

      if (payMethod === "vnpay") {
        const vnpRes = await axios.post(`${API}/vnpay/create`, { order_ids: orderIds }, { headers: authHeaders });
        if (vnpRes.data.payment_url) {
          window.location.href = vnpRes.data.payment_url;
          return;
        }
      }

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
    <div className="min-h-screen bg-background/20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-4 border-primary/20 rounded-[4rem] p-16 shadow-2xl flex flex-col items-center gap-8 max-w-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="w-28 h-28 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 group relative">
           <CheckCircle size={64} strokeWidth={3} className="group-hover:scale-110 transition-transform duration-500" />
           <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{t("checkout_page.order_success")}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
            {t("checkout_page.redirecting")}...
          </p>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background/20 text-foreground animate-in fade-in duration-1000 pb-20">
      {/* Precision Header */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-border/10 mb-8">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                <ShoppingBag size={20} strokeWidth={3} />
             </div>
             <div>
                <h1 className="text-sm font-black uppercase tracking-[0.3em] font-black">{t("checkout_page.title") || "THANH TOÁN"}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                   KIỂM TRA VÀ XÁC NHẬN ĐƠN HÀNG
                </p>
             </div>
          </div>
          <button onClick={() => router.back()} className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all flex items-center gap-2 group">
            <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            <span className="border-b border-transparent group-hover:border-primary transition-all">QUAY LẠI GIỎ HÀNG</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
          <div className="space-y-10">
            {/* Shipping Address Section */}
            <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-8 border-b border-border/5 pb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <MapPin size={22} />
                </div>
                <div>
                   <h2 className="text-sm font-black uppercase tracking-[0.2em]">ĐỊA CHỈ NHẬN HÀNG</h2>
                   <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-40">CHỌN ĐỊA CHỈ GIAO HÀNG</p>
                </div>
              </div>
              
              {addresses.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-border/10 rounded-[2rem] text-center space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("checkout_page.no_addresses")}</p>
                  <Link href="/profile" className="inline-block px-8 py-3 bg-muted/20 border border-border/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    {t("checkout_page.add_in_profile")}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {addresses.map((addr) => (
                    <label key={addr.id} 
                      className={`relative flex items-start gap-4 p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 group
                        ${selectedAddr === addr.id 
                          ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]" 
                          : "border-border/10 bg-muted/5 opacity-60 hover:opacity-100 hover:border-primary/30"}`}
                    >
                      <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAddr === addr.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                         {selectedAddr === addr.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input type="radio" name="address" checked={selectedAddr === addr.id} onChange={() => setSelectedAddr(addr.id)} className="sr-only" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-xs font-black uppercase tracking-tight leading-tight">{addr.address_line_1}</p>
                          {addr.is_default && <span className="text-[7px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-wider">{t("profile_page.default")}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{addr.city}, {addr.country}</p>
                      </div>
                      {selectedAddr === addr.id && <div className="absolute top-4 right-4 text-primary"><ShieldCheck size={20} /></div>}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-8 border-b border-border/5 pb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <CreditCard size={22} />
                </div>
                <div>
                   <h2 className="text-sm font-black uppercase tracking-[0.2em]">PHƯƠNG THỨC THANH TOÁN</h2>
                   <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-40">CHỌN CÁCH THỨC CHI TRẢ</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.value} 
                    className={`relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300
                      ${payMethod === m.value 
                        ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]" 
                        : "border-border/10 bg-muted/5 opacity-60 hover:opacity-100 hover:border-primary/30"}`}
                  >
                    <input type="radio" name="payment" value={m.value} checked={payMethod === m.value} onChange={() => setPayMethod(m.value)} className="sr-only" />
                    <span className="text-3xl filter transition-transform group-hover:scale-110">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest">{m.label}</p>
                      <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 tracking-widest truncate">{m.desc}</p>
                    </div>
                    {payMethod === m.value && <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-ping" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/10 rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <ClipboardList size={22} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">{t("checkout_page.order_notes")}</h2>
              </div>
              <textarea 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                rows={3}
                placeholder={t("checkout_page.notes_placeholder")}
                className="w-full px-6 py-5 bg-muted/20 border border-border/10 rounded-2xl text-[11px] font-black uppercase tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner" 
              />
            </div>
          </div>

          {/* Floating Summary - Premium Glass Card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-4 border-primary/20 rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
               
               <div className="space-y-1 relative z-10 border-b border-border/5 pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{t("cart_page.summary")}</h2>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.3em] opacity-40">XÁC NHẬN SẢN PHẨM</p>
               </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl p-2 shrink-0 flex items-center justify-center border border-border/10 shadow-inner group-hover:scale-105 transition-transform">
                      <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase line-clamp-1 tracking-tight text-foreground/80">{item.title}</p>
                      <p className="text-[9px] font-black text-primary uppercase opacity-60">QTY: {item.quantity}</p>
                    </div>
                    <p className="text-[11px] font-black tracking-tighter shrink-0">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-border/5 relative z-10">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground opacity-60">{t("cart_page.subtotal")}</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground opacity-60">{t("cart_page.shipping")}</span>
                  <span className={!shipping ? "text-primary font-black" : "text-foreground"}>
                    {shipping ? formatPrice(shipping) : "FREE"}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">TỔNG THANH TOÁN</span>
                  <span className="text-3xl font-black text-primary tracking-tighter leading-none">{formatPrice(total)}</span>
                </div>

                <button 
                  onClick={handlePlaceOrder} 
                  disabled={loading || !selectedAddr}
                  className="group w-full py-5 bg-primary text-white font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/30 relative overflow-hidden disabled:opacity-20 disabled:grayscale"
                >
                  <span className="relative z-10">{loading ? "PROCESSING..." : "XÁC NHẬN ĐẶT HÀNG"}</span>
                  {!loading && <CreditCard size={20} strokeWidth={3} className="relative z-10 group-hover:rotate-12 transition-transform" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
                
                {!selectedAddr && (
                   <p className="text-[8px] font-black uppercase text-destructive text-center mt-3 tracking-widest animate-pulse">
                      VUI LÒNG CHỌN ĐỊA CHỈ GIAO HÀNG
                   </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
