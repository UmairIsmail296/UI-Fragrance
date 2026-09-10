import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toNumericPrice } from '../utils/price.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'uif_cart_items';

const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    // Re-coerces unitPrice on every load — protects against any stale
    // localStorage entry rather than trusting whatever was frozen into storage.
    return parsed.map((item) => ({
      ...item,
      unitPrice: toNumericPrice(item.unitPrice ?? item.price),
    }));
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCartFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // perfume: the full perfume object from the API ({ _id, name, discountPrice, photos, ... })
  const addToCart = useCallback((perfume, quantity = 1) => {
    const qty = Math.min(10, Math.max(1, parseInt(quantity, 10) || 1));
    // FIXED: discountPrice is a real Number on the Perfume model now — no
    // more regex-parsing a "Rs. 4,500" string. This is the actual fix for
    // the "4500 shows as 0.45" bug: the buggy parsing step is gone
    // entirely, not just patched again.
    const unitPrice = toNumericPrice(perfume.discountPrice);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.perfumeId === perfume._id);

      if (existingIndex !== -1) {
        const updated = [...prev];
        const newQuantity = Math.min(10, updated[existingIndex].quantity + qty);
        // Also refreshes unitPrice on re-add, in case the perfume's price
        // changed in the admin panel since this item was first added.
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity, unitPrice };
        return updated;
      }

      return [
        ...prev,
        {
          perfumeId: perfume._id,
          name: perfume.name,
          unitPrice, // FIXED: always a number
          mainPhoto: perfume.photos?.[0] || perfume.image || '',
          quantity: qty,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((perfumeId) => {
    setCartItems((prev) => prev.filter((item) => item.perfumeId !== perfumeId));
  }, []);

  const updateQuantity = useCallback((perfumeId, newQuantity) => {
    const qty = Math.min(10, Math.max(1, parseInt(newQuantity, 10) || 1));
    setCartItems((prev) =>
      prev.map((item) => (item.perfumeId === perfumeId ? { ...item, quantity: qty } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalItems = useCallback(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Re-coerces unitPrice at calculation time as a final safety net, on top
  // of the load-time and add-time coercion above.
  const getTotalPrice = useCallback(
    () =>
      cartItems.reduce((sum, item) => sum + toNumericPrice(item.unitPrice) * item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};