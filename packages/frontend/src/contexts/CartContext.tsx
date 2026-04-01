import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '../types';

interface CartContextValue {
  items: CartItem[];
  addItem: (menu: MenuItem, quantity: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  removeItem: (menuId: number) => void;
  clear: () => void;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const addItem = useCallback((menu: MenuItem, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuId === menu.id);
      const next = existing
        ? prev.map(i => i.menuId === menu.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { menuId: menu.id, menuName: menu.name, unitPrice: menu.price, quantity }];
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((menuId: number, quantity: number) => {
    setItems(prev => {
      const next = quantity <= 0 ? prev.filter(i => i.menuId !== menuId)
        : prev.map(i => i.menuId === menuId ? { ...i, quantity } : i);
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((menuId: number) => {
    setItems(prev => {
      const next = prev.filter(i => i.menuId !== menuId);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totalAmount, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
