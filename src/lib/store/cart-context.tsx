
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

      return [...prev, {
        ...product,
        price: effectivePrice,
        image: effectiveImage,
        cartItemId: itemKey,
        quantity,
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

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal }}>
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
