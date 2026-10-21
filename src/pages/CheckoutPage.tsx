import { CreditCard, MessageCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { formatPrice, uid } from '../lib/format'
import { saveOrder } from '../lib/storage'
import { orderWhatsAppMessage, waLink } from '../lib/whatsapp'

export function CheckoutPage() {
  const { site } = useSite()
  const { items, total, containsAlcohol, clear } = useCart()
  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    phone: '',
    delivery_method: 'envio' as 'envio' | 'retiro',
    address: '',
    payment_method: 'whatsapp' as 'whatsapp' | 'mercadopago',
    notes: '',
    age_confirmed: false,
    accept_terms: false,
    newsletter: false,
  })
  const [done, setDone] = useState<{ order: string; url: string } | null>(null)

  const set = (key: keyof typeof form) => (event: { target: { value?: string; checked?: boolean } }) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value ?? event.target.checked ?? prev[key] }))
  }

  if (!items.length && !done) {
    return (
      <div className="empty">
        <Seo title={`Checkout · ${site.brand.name}`} />
        <h1 className="font-display" style={{ fontSize: '2rem' }}>No hay productos en el carrito</h1>
        <Link to="/#productos" className="btn btn-primary" style={{ marginTop: 24 }}>Ver catálogo</Link>
      </div>
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.accept_terms) return
    if (containsAlcohol && !form.age_confirmed) return
    const orderNumber = `DM-${Date.now().toString().slice(-6)}`
    saveOrder({
      id: uid('order'),
      createdAt: new Date().toISOString(),
      customer: form.customer_name,
      email: form.email,
      phone: form.phone,
      deliveryMethod: form.delivery_method,
      address: form.address,
      paymentMethod: form.payment_method,
      notes: form.notes,
      items,
      total,
    })
    const message = orderWhatsAppMessage({
      orderNumber,
      customer: form.customer_name,
      items,
      total,
      deliveryMethod: form.delivery_method,
      address: form.address,
      notes: form.notes,
      paymentMethod: form.payment_method,
    })
    const url = waLink(site.brand.whatsapp, message)
    clear()
    setDone({ order: orderNumber, url })
  }

  if (done) {
    return (
      <div className="container page-pad" style={{ maxWidth: 640, textAlign: 'center' }}>
        <Seo title={`Pedido registrado · ${site.brand.name}`} />
        <h1 className="font-display" style={{ fontSize: '2.4rem' }}>¡El pedido quedó registrado!</h1>
        <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Pedido {done.order}</p>
        <p style={{ marginTop: 16, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Falta enviarlo por WhatsApp. Abrir WhatsApp registra una intención de compra; la venta recién se confirma cuando el negocio acepta el pedido.
        </p>
        <a className="btn btn-green" style={{ marginTop: 28 }} href={done.url} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Enviar pedido por WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="container-wide page-pad">
      <Seo title={`Checkout · ${site.brand.name}`} />
      <h1 className="font-display" style={{ fontSize: '2.4rem' }}>Completá tu pedido</h1>
      <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
        El pedido se registra en este dispositivo y se confirma por WhatsApp. El cobro y la entrega se coordinan con Dulces Maxi.
      </p>
      <div className="checkout-layout" style={{ marginTop: 28 }}>
        <form className="card form-grid two" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="customer_name">Nombre y apellido</label>
            <input id="customer_name" required minLength={2} autoComplete="name" value={form.customer_name} onChange={set('customer_name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" required type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="phone">Teléfono / WhatsApp</label>
            <input id="phone" required minLength={6} type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <fieldset className="field" style={{ gridColumn: '1 / -1', border: 0, padding: 0 }}>
            <legend>¿Cómo querés recibirlo?</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              {([['envio', 'Envío a coordinar'], ['retiro', 'Retiro a coordinar']] as const).map(([value, label]) => (
                <label key={value} className={`choice ${form.delivery_method === value ? 'active' : ''}`}>
                  <input type="radio" name="delivery_method" value={value} checked={form.delivery_method === value} onChange={set('delivery_method')} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {form.delivery_method === 'envio' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="address">Dirección o referencia</label>
              <input id="address" required autoComplete="street-address" value={form.address} onChange={set('address')} />
            </div>
          )}
          <fieldset className="field" style={{ gridColumn: '1 / -1', border: 0, padding: 0 }}>
            <legend>¿Cómo querés pagar?</legend>
            <div className="stack" style={{ marginTop: 8 }}>
              <label className={`pay-card mp ${form.payment_method === 'mercadopago' ? 'active' : ''}`}>
                <input type="radio" name="payment_method" value="mercadopago" checked={form.payment_method === 'mercadopago'} onChange={set('payment_method')} />
                <span>
                  <strong style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CreditCard size={16} color="#009EE3" /> Mercado Pago</strong>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Indicá esta preferencia y coordinamos el cobro. No se abre un checkout externo en esta versión.
                  </span>
                </span>
              </label>
              <label className={`pay-card wa ${form.payment_method === 'whatsapp' ? 'active' : ''}`}>
                <input type="radio" name="payment_method" value="whatsapp" checked={form.payment_method === 'whatsapp'} onChange={set('payment_method')} />
                <span>
                  <strong style={{ display: 'flex', gap: 8, alignItems: 'center' }}><MessageCircle size={16} color="var(--color-green)" /> Coordinar por WhatsApp</strong>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Registrá el pedido y acordá el pago después.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="notes">Notas del pedido (opcional)</label>
            <textarea id="notes" rows={4} maxLength={800} placeholder="Horario preferido, dedicatoria o consulta…" value={form.notes} onChange={set('notes')} />
          </div>
          {containsAlcohol && (
            <label className="choice" style={{ gridColumn: '1 / -1', minHeight: 'auto', padding: 16, background: '#F0E7F6', borderColor: '#C9ADD7' }}>
              <input type="checkbox" checked={form.age_confirmed} onChange={(e) => setForm((prev) => ({ ...prev, age_confirmed: e.target.checked }))} />
              <span><strong>Confirmo que soy mayor de 18 años</strong> y que quien reciba las bebidas también lo será.</span>
            </label>
          )}
          <label className="choice" style={{ gridColumn: '1 / -1', minHeight: 'auto', padding: 8, border: 0, background: 'transparent' }}>
            <input type="checkbox" required checked={form.accept_terms} onChange={(e) => setForm((prev) => ({ ...prev, accept_terms: e.target.checked }))} />
            <span>Acepto los <Link to="/terminos">términos</Link> y la <Link to="/privacidad">política de privacidad</Link>.</span>
          </label>
          <label className="choice" style={{ gridColumn: '1 / -1', minHeight: 'auto', padding: 8, border: 0, background: 'transparent' }}>
            <input type="checkbox" checked={form.newsletter} onChange={(e) => setForm((prev) => ({ ...prev, newsletter: e.target.checked }))} />
            <span>Quiero recibir novedades y promociones. Es opcional y podré revocarlo.</span>
          </label>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
            Registrar pedido
          </button>
          <p style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Tus datos se usan para gestionar este pedido.
          </p>
        </form>
        <aside className="card" style={{ height: 'fit-content' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem' }}>Resumen del pedido</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
            {items.map((item) => (
              <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, fontSize: 14 }}>
                <span>{item.quantity} × {item.name}</span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--color-primary)' }}>
            <span>Total</span> <span>{formatPrice(total)}</span>
          </p>
        </aside>
      </div>
    </div>
  )
}
