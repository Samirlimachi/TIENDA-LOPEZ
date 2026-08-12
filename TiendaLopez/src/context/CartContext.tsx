import React, { createContext, useContext, useMemo, useState } from 'react';
import { Product } from '@models/index';

export type PriceType = 'price' | 'price2';

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: PriceType;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, priceType?: PriceType) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  setPriceType: (productId: number, priceType: PriceType) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const priceOf = (product: Product, priceType: PriceType) =>
  priceType === 'price' ? product.price : product.price2;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number = 1, priceType?: PriceType) => {
    if (product.stock <= 0) {
      return;
    }
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      const resolvedPriceType: PriceType =
        priceType ?? existing?.priceType ?? (product.price2 !== null ? 'price2' : 'price');
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, product.stock);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: nextQuantity, priceType: resolvedPriceType }
            : item,
        );
      }
      const cappedQuantity = Math.min(quantity, product.stock);
      return [...prev, { product, quantity: cappedQuantity, priceType: resolvedPriceType }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setItems(prev =>
      prev
        .map(item => {
          if (item.product.id !== productId) {
            return item;
          }
          const nextQuantity = item.quantity + delta;
          if (nextQuantity <= 0) {
            return null;
          }
          if (nextQuantity > item.product.stock) {
            return item;
          }
          return { ...item, quantity: nextQuantity };
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const setPriceType = (productId: number, priceType: PriceType) => {
    setItems(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, priceType } : item)),
    );
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = priceOf(item.product, item.priceType);
        return sum + (price ? Number(price) * item.quantity : 0);
      }, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, setPriceType, clear, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};
