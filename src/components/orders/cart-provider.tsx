"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem } from "@/types/orders";
const key = "luna-cart-v1";
type CartContext = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQuantity: (productId: string, priceId: string, quantity: number) => void;
  remove: (productId: string, priceId: string) => void;
  clear: () => void;
};
const Context = createContext<CartContext | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as CartItem[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [items]);
  const add = (item: CartItem) =>
    setItems((current) => {
      const found = current.find(
        (entry) => entry.productId === item.productId && entry.priceId === item.priceId,
      );
      return found
        ? current.map((entry) =>
            entry === found
              ? { ...entry, quantity: Math.min(99, entry.quantity + item.quantity) }
              : entry,
          )
        : [...current, item];
    });
  const setQuantity = (productId: string, priceId: string, quantity: number) =>
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId && item.priceId === priceId ? { ...item, quantity } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  const remove = (productId: string, priceId: string) =>
    setItems((current) =>
      current.filter((item) => !(item.productId === productId && item.priceId === priceId)),
    );
  return (
    <Context.Provider value={{ items, add, setQuantity, remove, clear: () => setItems([]) }}>
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
