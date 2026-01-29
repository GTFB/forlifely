'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const CART_STORAGE_KEY = 'smirnova-marketplace-cart'

export interface CartItem {
  productId: number | string
  variantId: number | string
  productData: any
  variantData: any
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQuantity: (productId: number | string, variantId: number | string, quantity: number) => void
  removeItem: (productId: number | string, variantId: number | string) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save cart:', error)
  }
}

function extractPrice(dataIn: any): number {
  if (!dataIn) return 0
  if (typeof dataIn.price === 'number') return dataIn.price
  if (typeof dataIn.price === 'string') {
    const parsed = parseFloat(dataIn.price)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    setItems(loadCartFromStorage())
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
      )

      if (existingIndex >= 0) {
        // Update quantity if item already exists
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        }
        return updated
      } else {
        // Add new item
        return [...prevItems, newItem]
      }
    })
  }, [])

  const removeItem = useCallback((productId: number | string, variantId: number | string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    )
  }, [])

  const updateQuantity = useCallback(
    (productId: number | string, variantId: number | string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId)
        return
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity }
            : item
        )
      )
    },
    [removeItem]
  )

  const getTotalPrice = useCallback((): number => {
    return items.reduce((total, item) => {
      const price = extractPrice(item.variantData?.data_in)
      return total + price * item.quantity
    }, 0)
  }, [items])

  const getTotalItems = useCallback((): number => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }, [items])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        getTotalPrice,
        getTotalItems,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}







