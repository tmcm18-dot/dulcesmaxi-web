import { defaultSite } from '../content/defaultSite'
import type { CartItem, SiteContent, StoredOrder } from '../types'

const SITE_KEY = 'dulces_maxi_site_v1'
const CART_KEY = 'dulces_maxi_cart_v1'
const FAV_KEY = 'dulces_maxi_favorites'
const CONSENT_KEY = 'dulces_maxi_privacy_consent_v1'
const ORDERS_KEY = 'dulces_maxi_orders_v1'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadSite(): SiteContent {
  const stored = readJson<SiteContent | null>(SITE_KEY, null)
  if (!stored || stored.version !== 1) return structuredClone(defaultSite)
  return {
    ...structuredClone(defaultSite),
    ...stored,
    colors: { ...defaultSite.colors, ...stored.colors },
    brand: { ...defaultSite.brand, ...stored.brand },
    hero: { ...defaultSite.hero, ...stored.hero },
    legal: { ...defaultSite.legal, ...stored.legal },
    pastryPage: { ...defaultSite.pastryPage, ...stored.pastryPage },
    reviews: { ...defaultSite.reviews, ...stored.reviews },
    products: stored.products?.length ? stored.products : defaultSite.products,
    sections: stored.sections?.length ? stored.sections : defaultSite.sections,
  }
}

export function saveSite(site: SiteContent) {
  writeJson(SITE_KEY, site)
}

export function resetSite() {
  window.localStorage.removeItem(SITE_KEY)
  return structuredClone(defaultSite)
}

export function loadCart(): CartItem[] {
  const items = readJson<CartItem[]>(CART_KEY, [])
  return Array.isArray(items) ? items : []
}

export function saveCart(items: CartItem[]) {
  writeJson(CART_KEY, items)
  window.dispatchEvent(new Event('dulces_maxi_cart_updated'))
}

export function loadFavorites(): string[] {
  const ids = readJson<string[]>(FAV_KEY, [])
  return Array.isArray(ids) ? ids : []
}

export function saveFavorites(ids: string[]) {
  writeJson(FAV_KEY, ids)
}

export function loadConsent(): boolean | null {
  const value = readJson<boolean | null>(CONSENT_KEY, null)
  return typeof value === 'boolean' ? value : null
}

export function saveConsent(acceptedAnalytics: boolean) {
  writeJson(CONSENT_KEY, acceptedAnalytics)
}

export function loadOrders(): StoredOrder[] {
  const orders = readJson<StoredOrder[]>(ORDERS_KEY, [])
  return Array.isArray(orders) ? orders : []
}

export function saveOrder(order: StoredOrder) {
  const orders = loadOrders()
  orders.unshift(order)
  writeJson(ORDERS_KEY, orders.slice(0, 50))
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1200) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', 0.82)
}
