import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { formatPrice } from '../lib/format'

export function CartPage() {
  const { site } = useSite()
  const { items, total, setQuantity, remove, containsAlcohol } = useCart()

  if (!items.length) {
    return (
      <div className="empty">
        <Seo title={`Carrito · ${site.brand.name}`} />
        <div className="empty-icon" aria-hidden="true">🍓</div>
        <h1 className="font-display" style={{ fontSize: '2rem' }}>Tu carrito está vacío</h1>
        <p style={{ margin: '12px auto 0', maxWidth: '32rem', color: 'var(--color-text-muted)' }}>
          Elegí una mermelada, un dulce regional o un combo artesanal y volvé cuando quieras: guardamos tu selección en este dispositivo.
        </p>
        <Link to="/#productos" className="btn btn-primary" style={{ marginTop: 28 }}>
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="container-wide page-pad">
      <Seo title={`Carrito · ${site.brand.name}`} />
      <h1 className="font-display" style={{ fontSize: '2.4rem' }}>Tu carrito</h1>
      <div className="cart-layout" style={{ marginTop: 28 }}>
        <div className="stack">
          {items.map((item) => (
            <article key={item.productId} className="card" style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 16, alignItems: 'center' }}>
              <Link to={`/product/${item.productId}`}>
                <img src={item.imageUrl} alt="" width={88} height={110} style={{ width: 88, height: 110, objectFit: 'cover', borderRadius: 16 }} />
              </Link>
              <div>
                <Link to={`/product/${item.productId}`} className="font-display" style={{ fontWeight: 700 }}>
                  {item.name}
                </Link>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.size}</p>
                <div className="qty" style={{ marginTop: 12 }}>
                  <button type="button" aria-label="Restar" onClick={() => setQuantity(item.productId, item.quantity - 1)}>
                    <Minus size={14} />
                  </button>
                  <span style={{ width: 32, textAlign: 'center', fontWeight: 800 }}>{item.quantity}</span>
                  <button type="button" aria-label="Sumar" onClick={() => setQuantity(item.productId, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 110 }}>
                <button type="button" className="icon-round" style={{ width: 40, height: 40 }} aria-label={`Quitar ${item.name}`} onClick={() => remove(item.productId)}>
                  <Trash2 size={16} />
                </button>
                <p style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{formatPrice(item.price * item.quantity)}</p>
              </div>
            </article>
          ))}
        </div>
        <aside className="card" style={{ position: 'sticky', top: 112, height: 'fit-content' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem' }}>Resumen</h2>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 20 }}>
            <span style={{ color: '#7b6854' }}>Productos</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <strong>Total estimado</strong>
            <strong style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>{formatPrice(total)}</strong>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
            El costo de entrega y la forma de pago se coordinan al confirmar el pedido.
          </p>
          {containsAlcohol && (
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Este carrito contiene alcohol. Se pedirá confirmación de mayoría de edad.
            </p>
          )}
          <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: 24, borderRadius: 999 }}>
            Continuar con el pedido
          </Link>
        </aside>
      </div>
    </div>
  )
}
