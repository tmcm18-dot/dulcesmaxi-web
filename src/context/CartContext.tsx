import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadCart, saveCart } from '../lib/storage'
import type { CartItem, Product } from '../types'

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  containsAlcohol: boolean
  add: (product: Product, quantity?: number) => boolean
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    const sync = () => setItems(loadCart())
    window.addEventListener('dulces_maxi_cart_updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('dulces_maxi_cart_updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    saveCart(next)
  }, [])

  const add = useCallback(
    (product: Product, quantity = 1) => {
      if (product.category === 'pasteleria') return false
      const stock = Math.max(0, Number(product.stock) || 0)
      if (stock <= 0) return false
      const current = items.find((item) => item.productId === product.id)
      const nextQty = Math.min(stock, (current?.quantity || 0) + quantity)
      const nextItem: CartItem = {
        productId: product.id,
        name: product.name,
        size: product.size,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: nextQty,
        stock,
        category: product.category,
      }
      persist(
        current
          ? items.map((item) => (item.productId === product.id ? nextItem : item))
          : [...items, nextItem],
      )
      return true
    },
    [items, persist],
  )

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      persist(
        items
          .map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(0, Math.min(item.stock || 99, quantity)) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      )
    },
    [items, persist],
  )

  const remove = useCallback(
    (productId: string) => persist(items.filter((item) => item.productId !== productId)),
    [items, persist],
  )

  const clear = useCallback(() => persist([]), [persist])

  const value = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    return {
      items,
      count,
      total,
      containsAlcohol: items.some((item) => item.category === 'licor'),
      add,
      setQuantity,
      remove,
      clear,
    }
  }, [items, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
