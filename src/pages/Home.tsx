import {
  CakeSlice,
  Cherry,
  Heart,
  MessageCircle,
  Package,
  Search,
  Sparkles,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { Seo } from '../components/Seo'
import { useSite } from '../context/SiteContext'
import { waLink } from '../lib/whatsapp'
import type { HomeSection, Product, SiteContent } from '../types'

const CAT_ICONS = {
  mermelada: Cherry,
  dulce_regional: Sparkles,
  pasteleria: CakeSlice,
  combo: Package,
} as const

const BENEFIT_ICONS = [Cherry, Package, MessageCircle]

function Hero({ products, onFilter }: { products: Product[]; onFilter: (key: string) => void }) {
  const { site } = useSite()
  const strawberry =
    products.find((product) => {
      const blob = [product.name, product.shortDescription, product.description].join(' ').toLowerCase()
      return product.category === 'mermelada' && product.imageUrl && blob.includes('frutill')
    }) || null
  const featured =
    products.filter((product) => product.featured && product.imageUrl).find((product) => product.id !== strawberry?.id) ||
    products.find((product) => product.featured) ||
    null

  return (
    <section className="hero brand-gradient">
      <div className="container-wide hero-grid">
        <div>
          <div className="hero-kicker">
            <Sparkles size={16} /> {site.hero.badge}
          </div>
          <h1>{site.hero.title}</h1>
          <p className="hero-sub">{site.hero.subtitle}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onFilter('all')}>
              {site.hero.ctaPrimary}
            </button>
            <a className="btn btn-outline" href={waLink(site.brand.whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircle size={20} /> {site.hero.ctaWhatsapp}
            </a>
          </div>
          {site.brand.demoNote ? <p className="demo-note">{site.brand.demoNote}</p> : null}
        </div>
        <div className="hero-photos">
          <div className="blob blob-orange" />
          <div className="blob blob-pink" />
          <div className="hero-photo-grid">
            {strawberry ? (
              <Link to={`/product/${strawberry.id}`} className="hero-photo offset" aria-label={`Ver ${strawberry.name}`}>
                <img src={strawberry.imageUrl} alt={strawberry.name} fetchPriority="high" decoding="async" />
                <span className="hero-caption">{site.hero.strawberryLabel}</span>
              </Link>
            ) : null}
            {featured ? (
              <Link to={`/product/${featured.id}`} className="hero-photo" aria-label={`Ver producto destacado: ${featured.name}`}>
                <img src={featured.imageUrl} alt={featured.name} loading="eager" decoding="async" />
                <span className="pill-featured">{site.hero.featuredBadge}</span>
                <span className="hero-featured">{featured.name}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function Categories({ onFilter }: { onFilter: (key: string) => void }) {
  const { site } = useSite()
  return (
    <section className="container-wide">
      <div className="cat-grid">
        {site.categories.map((category) => {
          const Icon = CAT_ICONS[category.key as keyof typeof CAT_ICONS] || Cherry
          return (
            <button
              key={category.key}
              type="button"
              className={`cat-card cat-${category.key}`}
              onClick={() => onFilter(category.key === 'pasteleria' ? 'pasteleria' : category.key)}
            >
              <Icon size={28} />
              <h2>{category.title}</h2>
              <p>{category.copy}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function renderSection(
  section: HomeSection,
  site: SiteContent,
  ctx: {
    products: Product[]
    filtered: Product[]
    featured: Product[]
    query: string
    filter: string
    onFilter: (key: string) => void
  },
) {
  if (!section.enabled) return null
  if (section.type === 'hero') return <Hero key={section.id} products={ctx.products} onFilter={ctx.onFilter} />
  if (section.type === 'categories') return <Categories key={section.id} onFilter={ctx.onFilter} />
  if (section.type === 'featured' && ctx.featured.length) {
    return (
      <section key={section.id} className="container-wide section">
        <div className="section-head">
          <div>
            <p className="eyebrow eyebrow-orange">{section.eyebrow || 'Los favoritos'}</p>
            <h2 className="section-title">{section.title || 'Más elegidos'}</h2>
          </div>
          <Heart size={32} fill="var(--color-yellow)" color="var(--color-yellow)" />
        </div>
        <div className="product-grid featured">
          {ctx.featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    )
  }
  if (section.type === 'catalog') {
    return (
      <section key={section.id} className="container-wide section" id="productos">
        <div className="catalog-head">
          <div>
            <p className="eyebrow eyebrow-primary">{section.eyebrow || 'Catálogo'}</p>
            <h2 className="section-title">{section.title || 'Elegí tu próximo sabor favorito'}</h2>
            {ctx.query ? (
              <p style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                <Search size={16} /> Resultados para “{ctx.query}”
              </p>
            ) : null}
          </div>
          <div className="filter-row" role="group" aria-label="Filtrar catálogo">
            {site.filters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="filter-chip"
                aria-pressed={ctx.filter === chip.key}
                onClick={() => ctx.onFilter(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        {ctx.filtered.length === 0 ? (
          <p className="empty">No encontramos productos con esos filtros.</p>
        ) : (
          <div className="product-grid catalog">
            {ctx.filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    )
  }
  if (section.type === 'pastryCta') {
    return (
      <section key={section.id} className="container-wide" style={{ marginTop: 80 }}>
        <div className="cta-band cta-pastry cta-inner">
          <div className="cta-copy">
            <div className="cta-icon">
              <CakeSlice size={28} />
            </div>
            <div>
              <p className="eyebrow eyebrow-primary">{section.eyebrow || 'Nueva sección'}</p>
              <h2 className="font-display" style={{ marginTop: 8, fontSize: '1.875rem' }}>
                {section.title}
              </h2>
              <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{section.body}</p>
            </div>
          </div>
          <Link to={section.ctaHref || '/pasteleria'} className="btn btn-primary" style={{ marginTop: 28 }}>
            <CakeSlice size={20} /> {section.ctaLabel || 'Ver pastelería'}
          </Link>
        </div>
      </section>
    )
  }
  if (section.type === 'combosCta') {
    return (
      <section key={section.id} className="container-wide" style={{ marginTop: 20 }}>
        <div className="cta-band cta-combo cta-inner">
          <div>
            <p className="eyebrow" style={{ color: '#FFF1B8' }}>
              {section.eyebrow}
            </p>
            <h2 className="font-display" style={{ marginTop: 12, fontSize: '1.875rem' }}>
              {section.title}
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,.85)' }}>{section.body}</p>
          </div>
          <a
            className="btn btn-white"
            href={section.ctaHref === 'whatsapp' ? waLink(site.brand.whatsapp) : section.ctaHref}
            target={section.ctaHref === 'whatsapp' ? '_blank' : undefined}
            rel="noreferrer"
            style={{ marginTop: 28 }}
          >
            <MessageCircle size={20} /> {section.ctaLabel}
          </a>
        </div>
      </section>
    )
  }
  if (section.type === 'benefits') {
    return (
      <section key={section.id} className="container-wide benefits">
        {site.benefits.map((benefit, index) => {
          const Icon = BENEFIT_ICONS[index] || Sparkles
          return (
            <div className="benefit" key={benefit.id}>
              <div className="benefit-icon">
                <Icon size={20} />
              </div>
              <div>
                <h2 className="font-display" style={{ fontSize: '1.125rem' }}>
                  {benefit.title}
                </h2>
                <p style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-muted)' }}>{benefit.description}</p>
              </div>
            </div>
          )
        })}
      </section>
    )
  }
  if (section.type === 'reviews') {
    return (
      <section key={section.id} className="container" style={{ maxWidth: 896, paddingBottom: 16, textAlign: 'center' }}>
        <div className="reviews-box">
          <p className="eyebrow eyebrow-purple">{site.reviews.eyebrow}</p>
          <h2 className="font-display" style={{ marginTop: 12, fontSize: '1.5rem' }}>
            {site.reviews.title}
          </h2>
          <p style={{ margin: '8px auto 0', maxWidth: '36rem', fontSize: 14, color: 'var(--color-text-muted)' }}>
            {site.reviews.body}
          </p>
        </div>
      </section>
    )
  }
  return (
    <section key={section.id} className="container-wide section">
      {section.imageUrl ? (
        <img src={section.imageUrl} alt="" loading="lazy" style={{ width: '100%', borderRadius: 28, marginBottom: 16 }} />
      ) : null}
      {section.eyebrow ? <p className="eyebrow eyebrow-primary">{section.eyebrow}</p> : null}
      {section.title ? <h2 className="section-title">{section.title}</h2> : null}
      {section.body ? (
        <p style={{ marginTop: 12, maxWidth: '48rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{section.body}</p>
      ) : null}
      {section.ctaLabel ? (
        <Link to={section.ctaHref || '/'} className="btn btn-primary" style={{ marginTop: 20 }}>
          {section.ctaLabel}
        </Link>
      ) : null}
    </section>
  )
}

export function Home() {
  const { site, visibleProducts } = useSite()
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') || '').trim().toLowerCase()
  const rawCategory = params.get('categoria') || 'all'
  const filter = site.filters.some((chip) => chip.key === rawCategory) ? rawCategory : 'all'

  const featured = useMemo(
    () => visibleProducts.filter((product) => product.featured).slice(0, 3),
    [visibleProducts],
  )
  const filtered = useMemo(
    () =>
      visibleProducts.filter((product) => {
        const matchesCategory = filter === 'all' || product.category === filter
        const haystack = [product.name, product.description, product.shortDescription, product.category, ...(product as Product & { tags?: string[] }).tags || []]
          .join(' ')
          .toLowerCase()
        return matchesCategory && (!query || haystack.includes(query))
      }),
    [visibleProducts, filter, query],
  )

  const onFilter = (key: string) => {
    const next = new URLSearchParams(params)
    if (key === 'all') next.delete('categoria')
    else next.set('categoria', key)
    if (key === 'pasteleria' && !visibleProducts.some((product) => product.category === 'pasteleria')) {
      window.location.assign('/pasteleria')
      return
    }
    setParams(next, { replace: true })
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Seo title={site.brand.seoTitle} description={site.brand.seoDescription} />
      {site.sections.map((section) =>
        renderSection(section, site, {
          products: visibleProducts,
          filtered,
          featured,
          query,
          filter,
          onFilter,
        }),
      )}
    </>
  )
}
