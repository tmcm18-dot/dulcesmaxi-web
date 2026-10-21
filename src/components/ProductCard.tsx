import { Heart, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { formatPrice, hasAlcohol, isPastry } from '../lib/format'
import type { Product } from '../types'

const BADGES: Record<string, string> = {
  mas_vendido: 'Más vendido',
  nuevo: 'Nuevo',
  oferta: 'Oferta',
  ultimas_unidades: 'Últimas unidades',
}

export function ProductCard({ product }: { product: Product }) {
  const { site, favorites, toggleFavorite } = useSite()
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const pastry = isPastry(product.category)
  const out = !pastry && Number(product.stock) <= 0
  const fav = favorites.includes(product.id)
  const sale = Number(product.compareAtPrice) > Number(product.price)

  const onAdd = () => {
    if (out) return
    add(product, 1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="product-card">
      <div className="product-media">
        <Link to={`/product/${product.id}`} aria-label={`Ver ${product.name}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.imageAlt || product.name} loading="lazy" />
          ) : (
            <div className="empty" style={{ padding: 24 }}>
              Falta cargar la foto
            </div>
          )}
        </Link>
        <div className="row" style={{ position: 'absolute', left: 12, top: 12, maxWidth: '70%' }}>
          {(BADGES[product.badge] || product.featured) && (
            <span className="badge badge-featured">{BADGES[product.badge] || 'Destacado'}</span>
          )}
          {hasAlcohol(product) && <span className="badge badge-18">+18</span>}
          {pastry && <span className="badge badge-encargo">Por encargo</span>}
        </div>
        <button
          type="button"
          className="fav-btn"
          aria-label={`${fav ? 'Quitar' : 'Agregar'} ${product.name} ${fav ? 'de' : 'a'} favoritos`}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
        </button>
        {out && <div className="stock-overlay">Sin stock</div>}
      </div>
      <div className="product-body">
        <p className="product-cat">{site.categoryLabels[product.category] || product.category}</p>
        <Link to={`/product/${product.id}`} className="product-name">
          {product.name}
        </Link>
        <p className="product-size">{product.size}</p>
        <div className="product-price-wrap">
          {sale && (
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
          <p className="text-price product-price">
            {pastry && product.price <= 0 ? 'Precio a presupuestar' : `${pastry ? 'Desde ' : ''}${formatPrice(product.price)}`}
          </p>
          <p className={`product-stock ${out ? 'out' : ''}`}>
            {pastry ? 'Disponible solo por encargo' : out ? 'No disponible' : `${product.stock} disponibles`}
          </p>
          {pastry ? (
            <Link to={`/pasteleria?producto=${product.id}&nombre=${encodeURIComponent(product.name)}&tipo=pasteleria#solicitar-presupuesto`} className="btn btn-green" style={{ width: '100%', marginTop: 12 }}>
              Pedir por encargo
            </Link>
          ) : (
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={out} onClick={onAdd}>
              <ShoppingBag size={16} /> {out ? 'Sin stock' : added ? 'Agregado ✓' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
