import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultSite } from '../content/defaultSite'
import { loadFavorites, loadSite, saveFavorites, saveSite } from '../lib/storage'
import type { Product, SiteContent } from '../types'

type SiteContextValue = {
  site: SiteContent
  setSite: (next: SiteContent) => void
  products: Product[]
  visibleProducts: Product[]
  favorites: string[]
  toggleFavorite: (id: string) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

function applyColors(site: SiteContent) {
  const root = document.documentElement
  const map: Record<string, string> = {
    '--color-primary': site.colors.primary,
    '--color-primary-dark': site.colors.primaryDark,
    '--color-orange': site.colors.orange,
    '--color-yellow': site.colors.yellow,
    '--color-green': site.colors.green,
    '--color-purple': site.colors.purple,
    '--color-background': site.colors.background,
    '--color-background-soft': site.colors.backgroundSoft,
    '--color-surface': site.colors.surface,
    '--color-text': site.colors.text,
    '--color-text-muted': site.colors.textMuted,
    '--color-border': site.colors.border,
    '--color-footer': site.colors.footer,
  }
  Object.entries(map).forEach(([key, value]) => root.style.setProperty(key, value))
  document.title = site.brand.seoTitle || defaultSite.brand.seoTitle
  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute('content', site.brand.seoDescription)
  const theme = document.querySelector('meta[name="theme-color"]')
  if (theme) theme.setAttribute('content', site.colors.primary)
}

export function SiteProvider({
  children,
  initialSite,
  persistMode = 'local',
}: {
  children: ReactNode
  initialSite?: SiteContent
  persistMode?: 'local' | 'none'
}) {
  const [site, setSiteState] = useState<SiteContent>(() => initialSite || loadSite())
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())

  useEffect(() => {
    applyColors(site)
  }, [site])

  useEffect(() => {
    if (initialSite || persistMode === 'none') return
    fetch('/api/catalog')
      .then((res) => res.json())
      .then((data: { site?: Partial<SiteContent>; products?: Product[] }) => {
        const next: SiteContent = {
          ...defaultSite,
          ...(data.site || {}),
          colors: { ...defaultSite.colors, ...(data.site?.colors || {}) },
          brand: { ...defaultSite.brand, ...(data.site?.brand || {}) },
          hero: { ...defaultSite.hero, ...(data.site?.hero || {}) },
          products: data.products?.length ? data.products : defaultSite.products,
        }
        setSiteState(next)
        saveSite(next)
      })
      .catch(() => {
        /* usa cache local */
      })
  }, [initialSite, persistMode])

  const setSite = useCallback((next: SiteContent) => {
    setSiteState(next)
    if (persistMode === 'local') saveSite(next)
  }, [persistMode])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      saveFavorites(next)
      return next
    })
  }, [])

  const visibleProducts = useMemo(
    () => site.products.filter((product) => product.active),
    [site.products],
  )

  const value = useMemo(
    () => ({
      site,
      setSite,
      products: site.products,
      visibleProducts,
      favorites,
      toggleFavorite,
    }),
    [site, setSite, visibleProducts, favorites, toggleFavorite],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite debe usarse dentro de SiteProvider')
  return ctx
}
