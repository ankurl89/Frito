"use client";

/**
 * Client-side shopping cart, scoped per-brand.
 *
 * Cart state is persisted in localStorage so it survives page refresh.
 * Keyed by brand slug so a customer can have separate carts across brands
 * if they shop at multiple Frito storefronts.
 *
 * Use `useCartHydrated()` instead of `useCart` directly when you need to
 * branch on whether the cart has loaded from localStorage. Otherwise the
 * first render sees the empty default and shows the wrong UI.
 */

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  brand_id: string;
  brand_slug: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQuantity: (productId: string, size: string | undefined, color: string | undefined, quantity: number) => void;
  remove: (productId: string, size: string | undefined, color: string | undefined) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: ({ quantity = 1, ...item }) => {
        const items = [...get().items];
        const idx = items.findIndex(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color);
        if (idx >= 0) items[idx].quantity += quantity;
        else items.push({ ...item, quantity });
        set({ items });
      },
      setQuantity: (productId, size, color, quantity) => {
        const items = get().items
          .map(i => (i.product_id === productId && i.size === size && i.color === color ? { ...i, quantity } : i))
          .filter(i => i.quantity > 0);
        set({ items });
      },
      remove: (productId, size, color) => {
        set({ items: get().items.filter(i => !(i.product_id === productId && i.size === size && i.color === color)) });
      },
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "frito-cart" }
  )
);

/**
 * Returns true once the persisted cart has loaded from localStorage.
 * On the first client render (or on SSR), the store is at its default empty
 * state — pages that branch on cart contents must wait for hydration.
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
