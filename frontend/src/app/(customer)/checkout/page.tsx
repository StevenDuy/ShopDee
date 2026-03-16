"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, ArrowLeft, CheckCircle, MapPin } from "lucide-react";
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
  const { token, user } = useAuthStore();
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

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    if (items.length === 0) { router.replace("/cart"); return; }
    axios.get("http://localhost:8000/api/profile/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { setAddresses(r.data); const def = r.data.find((a: Address) => a.is_default); if (def) setSelectedAddr(def.id); })
      .catch(() => {});
  }, [token, items, router]);

  const subtotal = totalPrice();
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total    = subtotal + shipping;

  // Group items by seller
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
          axios.post("http://localhost:8000/api/orders", {
            seller_id: Number(sellerId),
            shipping_address_id: selectedAddr,
            payment_method: payMethod,
            notes: note,
            items: sellerItems.map((i) => ({ 
              product_id: i.productId, 
              quantity: i.quantity, 
              unit_price: i.salePrice ?? i.price,
              selected_options: i.attributes
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

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <CheckCircle size={80} className="text-green-500" />
      </motion.div>
      <h1 className="text-2xl font-bold">{t("checkout_page.order_success")}</h1>
      <p className="text-muted-foreground">{t("checkout_page.redirecting")}</p>
    </div>
  );

  return (
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={18} /> {t("checkout_page.back_to_cart")}
      </button>
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2"><CreditCard size={24} /> {t("checkout_page.title")}</h1>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin size={18} /> {t("checkout_page.shipping_address")}</h2>
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("checkout_page.no_addresses")} <a href="/profile" className="text-primary underline">{t("checkout_page.add_in_profile")}</a></p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedAddr === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-muted-foreground"}`}>
                    <input type="radio" name="address" checked={selectedAddr === addr.id} onChange={() => setSelectedAddr(addr.id)} className="mt-1 w-4 h-4 text-primary focus:ring-primary border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-snug mb-1">{addr.address_line_1}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] text-muted-foreground font-medium shrink-0">{addr.city}, {addr.country}</p>
                        {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-primary/20">{t("profile_page.default")}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">{t("checkout_page.payment_method")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${payMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}>
                  <input type="radio" name="payment" value={m.value} checked={payMethod === m.value} onChange={() => setPayMethod(m.value)} />
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-3">{t("checkout_page.order_notes")}</h2>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder={t("checkout_page.notes_placeholder")}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold">{t("cart_page.summary")}</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 text-sm">
                  <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="font-medium shrink-0">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart_page.subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart_page.shipping")}</span><span className={!shipping ? "text-green-600" : ""}>{shipping ? formatPrice(shipping) : t("cart_page.free")}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>{t("cart_page.total")}</span><span className="text-primary">{formatPrice(total)}</span></div>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" /> : t("checkout_page.place_order")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
