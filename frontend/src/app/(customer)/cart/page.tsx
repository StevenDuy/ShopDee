"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const subtotal   = totalPrice();
  const shipping   = subtotal > 500000 ? 0 : 30000; // Free shipping above 500k VND
  const total      = subtotal + shipping;

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-muted-foreground">
      <ShoppingBag size={64} className="opacity-20" />
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
        <p>Add some products to get started</p>
      </div>
      <Link href="/products" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart size={24} /> Shopping Cart ({items.length} items)</h1>
        <button onClick={clearCart} className="text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">Clear All</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5"
              >
                <Link href={`/products/${item.productId}`} className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </Link>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.sellerName}</p>
                  {Object.entries(item.attributes).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <p className="font-bold text-primary mt-1">{formatPrice(item.salePrice ?? item.price)}</p>
                </div>

                <div className="flex items-center border border-border rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"><Minus size={14} /></button>
                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"><Plus size={14} /></button>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold">{formatPrice((item.salePrice ?? item.price) * item.quantity)}</p>
                  <button onClick={() => removeItem(item.productId)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg mt-2 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && <p className="text-xs text-muted-foreground">Free shipping on orders over {formatPrice(500000)}</p>}
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary">{formatPrice(total)}</span>
            </div>
            <Link href="/checkout"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              Proceed to Checkout <ArrowRight size={18} />
            </Link>
            <Link href="/products" className="w-full py-2 text-sm text-center text-muted-foreground hover:text-foreground transition-colors block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
