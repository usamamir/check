import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import { effectivePrice } from "@/data/products";

export type CartItem = {
  key: string;
  product: Product;
  size?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, size?: string, qty?: number) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  lastAdded: CartItem | null;
  dismissLastAdded: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jettribe-cart-v1";

function itemKey(product: Product, size?: string) {
  return `${product.slug}::${size || "onesize"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => {
      const price = effectivePrice(i.product) ?? 0;
      return n + price * i.qty;
    }, 0);

    return {
      items,
      count,
      subtotal,
      lastAdded,
      dismissLastAdded: () => setLastAdded(null),
      addItem: (product, size, qty = 1) => {
        const key = itemKey(product, size);
        setItems((prev) => {
          const existing = prev.find((i) => i.key === key);
          if (existing) {
            return prev.map((i) =>
              i.key === key ? { ...i, qty: i.qty + qty } : i,
            );
          }
          return [...prev, { key, product, size, qty }];
        });
        setLastAdded({ key, product, size, qty });
      },
      removeItem: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      updateQty: (key, qty) =>
        setItems((prev) =>
          prev
            .map((i) => (i.key === key ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        ),
      clear: () => setItems([]),
    };
  }, [items, lastAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
