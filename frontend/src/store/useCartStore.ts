import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  productId: number;
  slug: string;
  title: string;
  image: string;
  price: number;
  salePrice: number | null;
  quantity: number;
  sellerId: number;
  sellerName: string;
  attributes: Record<string, string>; // { Color: "Red", Size: "XL" }
  variantIds?: number[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({ items: get().items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i) });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity ?? 1 }] });
        }
      },

      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) return get().removeItem(productId);
        set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0),
    }),
    { name: "shopdee-cart" }
  )
);
