import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useMemo } from "react";

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
  userId?: number | null; // Added to separate carts by user
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, userId: number | null) => void;
  updateQuantity: (productId: number, userId: number | null, quantity: number) => void;
  clearCart: (userId: number | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => 
          i.productId === item.productId && 
          i.userId === (item.userId ?? null) &&
          JSON.stringify(i.variantIds) === JSON.stringify(item.variantIds)
        );

        if (existing) {
          set({ 
            items: get().items.map((i) => 
              (i.productId === item.productId && i.userId === (item.userId ?? null) && JSON.stringify(i.variantIds) === JSON.stringify(item.variantIds))
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } 
                : i
            ) 
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity ?? 1, userId: item.userId ?? null }] });
        }
      },

      removeItem: (productId, userId) => 
        set({ items: get().items.filter((i) => !(i.productId === productId && i.userId === userId)) }),

      updateQuantity: (productId, userId, quantity) => {
        if (quantity <= 0) return get().removeItem(productId, userId);
        set({ 
          items: get().items.map((i) => 
            (i.productId === productId && i.userId === userId) ? { ...i, quantity } : i
          ) 
        });
      },

      clearCart: (userId) => set({ items: get().items.filter(i => i.userId !== userId) }),
    }),
    { name: "shopdee-cart" }
  )
);

/**
 * Custom hook to use the cart with the current user's context.
 * This simplifies component logic by automatically filtering items 
 * and passing the correct userId to store methods.
 */
export const useCart = () => {
  const { user } = useAuthStore();
  const userId = user?.id ?? null;
  const store = useCartStore();

  const items = useMemo(() => 
    store.items.filter(i => i.userId === userId),
    [store.items, userId]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0);

  return {
    items,
    totalItems,
    totalPrice,
    addItem: (item: Omit<CartItem, "quantity" | "userId"> & { quantity?: number }) => 
      store.addItem({ ...item, userId }),
    removeItem: (productId: number) => 
      store.removeItem(productId, userId),
    updateQuantity: (productId: number, quantity: number) => 
      store.updateQuantity(productId, userId, quantity),
    clearCart: () => 
      store.clearCart(userId),
  };
};

