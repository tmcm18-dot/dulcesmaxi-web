export type CategoryKey =
  | 'mermelada'
  | 'dulce_regional'
  | 'pasteleria'
  | 'combo'
  | 'licor'
  | 'edicion_especial'

export type ProductBadge = '' | 'mas_vendido' | 'nuevo' | 'oferta' | 'ultimas_unidades'

export type Product = {
  id: string
  sku: string
  name: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice: number
  cost?: number
  size: string
  stock: number
  lowStockThreshold?: number
  expiresAt?: string
  category: CategoryKey
  featured: boolean
  imageUrl: string
  imageAlt: string
  ingredients: string
  allergens: string
  conservation: string
  badge: ProductBadge
  alcoholPercentage: number
  active: boolean
}

export type SectionType =
  | 'hero'
  | 'categories'
  | 'featured'
  | 'catalog'
  | 'pastryCta'
  | 'combosCta'
  | 'benefits'
  | 'reviews'
  | 'custom'

export type HomeSection = {
  id: string
  type: SectionType
  enabled: boolean
  title: string
  eyebrow: string
  body: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string
}

export type CategoryCard = {
  key: CategoryKey
  title: string
  copy: string
}

export type FilterChip = {
  key: 'all' | CategoryKey
  label: string
}

export type Benefit = {
  id: string
  title: string
  description: string
}

export type LegalPage = {
  title: string
  sections: { heading: string; body: string }[]
}

export type PastryItem = {
  id: string
  name: string
  description: string
  images: { src: string; alt: string }[]
}

export type SiteColors = {
  primary: string
  primaryDark: string
  orange: string
  yellow: string
  green: string
  purple: string
  background: string
  backgroundSoft: string
  surface: string
  text: string
  textMuted: string
  border: string
  footer: string
}

export type SiteContent = {
  version: 1
  colors: SiteColors
  brand: {
    name: string
    tagline: string
    topBar: string
    city: string
    phoneDisplay: string
    whatsapp: string
    demoNote: string
    seoTitle: string
    seoDescription: string
    footerBlurb: string
  }
  hero: {
    badge: string
    title: string
    subtitle: string
    ctaPrimary: string
    ctaWhatsapp: string
    strawberryLabel: string
    featuredBadge: string
  }
  categories: CategoryCard[]
  filters: FilterChip[]
  categoryLabels: Record<CategoryKey, string>
  benefits: Benefit[]
  reviews: {
    eyebrow: string
    title: string
    body: string
  }
  pastryPage: {
    badge: string
    title: string
    subtitle: string
    catalogEyebrow: string
    catalogTitle: string
    catalogIntro: string
    formTitle: string
    formIntro: string
  }
  pastryItems: PastryItem[]
  legal: {
    disclaimer: string
    terminos: LegalPage
    privacidad: LegalPage
    entregas: LegalPage
    alcohol: LegalPage
  }
  products: Product[]
  sections: HomeSection[]
}

export type CartItem = {
  productId: string
  name: string
  size: string
  price: number
  imageUrl: string
  quantity: number
  stock: number
  category: CategoryKey
}

export type StoredOrder = {
  id: string
  createdAt: string
  customer: string
  email: string
  phone: string
  deliveryMethod: 'envio' | 'retiro'
  address: string
  paymentMethod: 'whatsapp' | 'mercadopago'
  notes: string
  items: CartItem[]
  total: number
}
