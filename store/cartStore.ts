import { create } from "zustand";
import { type StateCreator } from "zustand/vanilla";

import { CartItem } from "../types";

interface CartStoreState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const normalizeCartItem = (item: CartItem): CartItem => ({
  ...item,
  quantity: Math.max(1, Math.floor(item.quantity || 1)),
});

const createCartStore: StateCreator<CartStoreState> = (set, get) => ({
  items: [],

  addItem: (item: CartItem) => {
    const nextItem = normalizeCartItem(item);

    set((state: CartStoreState) => {
      const existingItem = state.items.find(
        (cartItem: CartItem) => cartItem.productId === nextItem.productId
      );

      if (!existingItem) {
        return {
          items: [...state.items, nextItem],
        };
      }

      return {
        items: state.items.map((cartItem: CartItem) =>
          cartItem.productId === nextItem.productId
            ? {
                ...cartItem,
                quantity: cartItem.quantity + nextItem.quantity,
              }
            : cartItem
        ),
      };
    });
  },

  removeItem: (productId: string) =>
    set((state: CartStoreState) => ({
      items: state.items.filter((item: CartItem) => item.productId !== productId),
    })),

  updateQty: (productId: string, quantity: number) => {
    const nextQuantity = Math.max(0, Math.floor(quantity));

    set((state: CartStoreState) => {
      if (nextQuantity === 0) {
        return {
          items: state.items.filter((item: CartItem) => item.productId !== productId),
        };
      }

      return {
        items: state.items.map((item: CartItem) =>
          item.productId === productId
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item
        ),
      };
    });
  },

  clearCart: () => set({ items: [] }),

  setItems: (items: CartItem[]) =>
    set({
      items: items.map(normalizeCartItem),
    }),

  totalItems: () =>
    get().items.reduce(
      (sum: number, item: CartItem) => sum + Math.max(1, item.quantity),
      0
    ),

  totalPrice: () =>
    get().items.reduce(
      (sum: number, item: CartItem) =>
        sum + Math.max(1, item.quantity) * item.price,
      0
    ),
});

export const useCartStore = create<CartStoreState>(createCartStore);
