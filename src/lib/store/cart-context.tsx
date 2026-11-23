
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, options?: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  gstTotal: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('giftart_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('giftart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number, options?: Partial<CartItem>) => {
    setCart(prev => {
      const itemKey = options?.cartItemId || `${product.id}-${options?.selectedColor || ''}-${options?.selectedCapacity || options?.selectedSize || ''}-${options?.personalizationName || ''}`;
      const existingItemIndex = prev.findIndex(item => 
        (item.cartItemId || `${item.id}-${item.selectedColor || ''}-${item.selectedCapacity || item.selectedSize || ''}-${item.personalizationName || ''}`) === itemKey
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      const effectivePrice = options?.variantPrice || product.price;
      const effectiveImage = options?.variantImage || product.image;
      const effectiveGstType = options?.gstType || product.gstType || 'percentage';
      const effectiveGstRate = options?.gstRate !== undefined ? Number(options.gstRate) : (product.gstRate !== undefined ? Number(product.gstRate) : 0);

      return [...prev, {
        ...product,
        price: effectivePrice,
        image: effectiveImage,
        cartItemId: itemKey,
        quantity,
        gstType: effectiveGstType,
        gstRate: effectiveGstRate,
        ...options
      }];
    });
  };

  const removeFromCart = (identifier: string) => {
    setCart(prev => prev.filter(item => 
      (item.cartItemId || item.id) !== identifier && item.id !== identifier
    ));
  };

  const updateQuantity = (identifier: string, quantity: number) => {
    setCart(prev => prev.map(item => 
      ((item.cartItemId || item.id) === identifier || item.id === identifier)
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const calculateItemGst = (item: CartItem) => {
    const rate = Number(item.gstRate) || 0;
    if (rate <= 0) return 0;
    if (item.gstType === 'flat') {
      return Math.round(rate * item.quantity);
    }
    return Math.round(((item.price * item.quantity) * rate) / 100);
  };

  const gstTotal = cart.reduce((acc, item) => acc + calculateItemGst(item), 0);
  const total = subtotal + gstTotal;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal, gstTotal, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
