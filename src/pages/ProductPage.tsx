import { ArrowLeft, Heart, Minus, Plus, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { formatPrice, hasAlcohol, isPastry } from '../lib/format'

export function ProductPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { site, visibleProducts, favorites, toggleFavorite } = useSite()
  const { add } = useCart()
  const product = useMemo(() => visibleProducts.find((item) => item.id === id), [visibleProducts, id])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [zoom, setZoom] = useState(false)

  if (!product) {
    return (
      <div className="container page-pad" style={{ textAlign: 'center' }}>
        Producto no encontrado. <Link to="/" className="back-link">Volver a la tienda</Link>
      </div>
    )
  }

  const pastry = isPastry(product.category)
  const out = !pastry && product.stock <= 0
  const sale = product.compareAtPrice > product.price
  const fav = favorites.includes(product.id)

  const addToCart = () => {
    if (out) return
    add(product, qty)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="container-wide page-pad">
      <Seo title={`${product.name} · ${site.brand.name}`} description={product.shortDescription || product.description} />
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Volver a la tienda
      </Link>
      <div className="product-layout">
        <button type="button" className="product-hero-img" onClick={() => setZoom(true)} aria-label="Ampliar fotografía">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.imageAlt || product.name} />
          ) : (
            <div className="empty">Falta cargar la foto</div>
          )}
          <span className="zoom-btn">
            <Search size={20} />
          </span>
          {hasAlcohol(product) && (
            <span className="badge badge-18" style={{ position: 'absolute', left: 16, top: 16 }}>
              Venta +18
            </span>
          )}
        </button>
        <div>
          <p className="product-cat">
            {hasAlcohol(product) ? 'Licor artesanal' : pastry ? 'Pastelería por encargo' : 'Dulce artesanal'}
          </p>
          <h1 className="font-display" style={{ marginTop: 12, fontSize: 'clamp(2rem,4vw,3rem)', lineHeight: 1.1 }}>
            {product.name}
          </h1>
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 }}>
            <p className="text-price" style={{ fontSize: '1.875rem', color: 'var(--color-primary)' }}>
              {pastry && product.price <= 0 ? 'Precio a presupuestar' : `${pastry ? 'Desde ' : ''}${formatPrice(product.price)}`}
            </p>
            {sale && (
              <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>Presentación {product.size}</span>
          </div>
          <p style={{ marginTop: 28, whiteSpace: 'pre-line', fontSize: 16, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
            {product.description}
          </p>
          <div className="stock-box">
            <p style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={20} color="var(--color-green)" />
              {pastry
                ? 'Elaboración disponible solo por encargo'
                : out
                  ? 'Producto sin stock por el momento'
                  : `${product.stock} unidades disponibles`}
            </p>
          </div>
          {(product.ingredients || product.allergens || product.conservation) && (
            <dl style={{ marginTop: 24, display: 'grid', gap: 16, fontSize: 14 }}>
              {product.ingredients && (
                <div>
                  <dt style={{ fontWeight: 800 }}>Ingredientes</dt>
                  <dd style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', whiteSpace: 'pre-line' }}>
                    {product.ingredients}
                  </dd>
                </div>
              )}
              {product.allergens && (
                <div>
                  <dt style={{ fontWeight: 800 }}>Alérgenos</dt>
                  <dd style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{product.allergens}</dd>
                </div>
              )}
              {product.conservation && (
                <div>
                  <dt style={{ fontWeight: 800 }}>Conservación</dt>
                  <dd style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{product.conservation}</dd>
                </div>
              )}
            </dl>
          )}
          {pastry ? (
            <div className="card" style={{ marginTop: 32, background: '#F4FAF5', borderColor: '#B8D7C0' }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#49614F' }}>
                Este producto se prepara especialmente para vos. La fecha, cantidad, decoración y precio final se coordinan mediante un presupuesto.
              </p>
              <Link to="/pasteleria#solicitar-presupuesto" className="btn btn-green" style={{ marginTop: 20, width: '100%' }}>
                Pedir por encargo
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                  <div className="qty">
                    <button type="button" aria-label="Restar una unidad" onClick={() => setQty(Math.max(1, qty - 1))}>
                      <Minus size={16} />
                    </button>
                    <span style={{ width: 40, textAlign: 'center', fontWeight: 900 }} aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Sumar una unidad"
                      onClick={() => setQty(Math.min(Math.max(1, product.stock), qty + 1))}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={out} onClick={addToCart}>
                    <Heart size={16} /> {out ? 'Sin stock' : added ? 'Agregado al carrito ✓' : 'Agregar al carrito'}
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                  disabled={out}
                  onClick={() => {
                    addToCart()
                    if (!out) navigate('/cart')
                  }}
                >
                  Comprar ahora
                </button>
                <button type="button" className="btn" onClick={() => toggleFavorite(product.id)} style={{ color: 'var(--color-primary)' }}>
                  <Heart size={16} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {zoom && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setZoom(false)}>
          <button type="button" className="btn btn-white" style={{ position: 'absolute', right: 16, top: 16 }}>
            Cerrar
          </button>
          <img src={product.imageUrl} alt={product.imageAlt || product.name} />
        </div>
      )}
    </div>
  )
}
