import { CakeSlice, CalendarCheck, Lock, MessageCircle } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useSite } from '../context/SiteContext'
import { storefront } from '../lib/storefront'
import { pastryWhatsAppMessage, waLink } from '../lib/whatsapp'

const COVERS = [
  ['merengue_italiano', 'Merengue italiano'],
  ['chocolate_cobertura', 'Chocolate cobertura'],
  ['crema_manteca_frutas', 'Crema de manteca y frutas de estación'],
  ['otra', 'Otra cobertura (detallar en la descripción)'],
]

const PRODUCTS = {
  torta: ['Torta de manteca por encargo', 'Torta personalizada'],
  tarta: [
    'Lemon pie · molde Nº 22',
    'Orange pie · molde Nº 22',
    'Tarta de frutilla · molde Nº 22',
    'Cabsha · molde Nº 22',
    'Crumble de manzana · molde Nº 22',
    'Cheesecake · molde Nº 22',
  ],
  mesa_dulce: ['Cupcakes temáticos con crema de manteca', 'Mesa dulce personalizada'],
} as const

export function PasteleriaPage() {
  const { site } = useSite()
  const [params] = useSearchParams()
  const prefill = params.get('nombre') || ''
  const [category, setCategory] = useState<'torta' | 'tarta' | 'mesa_dulce'>('torta')
  const options = PRODUCTS[category]
  const [product, setProduct] = useState(prefill && options.includes(prefill as never) ? prefill : options[0])
  const [form, setForm] = useState({
    cake_name: '',
    desired_kg: '1',
    event_date: '',
    cover: 'merengue_italiano',
    description: prefill ? `Quiero solicitar ${prefill} por encargo.` : '',
    customer_name: '',
    phone: '',
    email: '',
    consent: false,
  })
  const [sent, setSent] = useState<string | null>(null)

  const tartas = useMemo(() => site.pastryItems, [site.pastryItems])

  const onCategory = (value: 'torta' | 'tarta' | 'mesa_dulce') => {
    setCategory(value)
    setProduct(PRODUCTS[value][0])
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.consent) return
    void storefront('create_pastry_request', {
      category,
      product: product === 'Torta personalizada' && form.cake_name ? form.cake_name : product,
      description: form.description,
      kg: category === 'torta' ? form.desired_kg : '',
      eventDate: form.event_date,
      cover: form.cover,
      customer: form.customer_name,
      phone: form.phone,
      email: form.email,
    })
    const url = waLink(
      site.brand.whatsapp,
      pastryWhatsAppMessage({
        category,
        product: product === 'Torta personalizada' && form.cake_name ? form.cake_name : product,
        description: form.description,
        name: form.customer_name,
        phone: form.phone,
        eventDate: form.event_date,
        kg: category === 'torta' ? form.desired_kg : undefined,
      }),
    )
    setSent(url)
  }

  return (
    <div>
      <Seo title={`Pastelería por encargo · ${site.brand.name}`} description={site.pastryPage.subtitle} />
      <section className="hero brand-gradient">
        <div className="container-wide hero-grid">
          <div>
            <div className="hero-kicker">
              <CakeSlice size={16} /> {site.pastryPage.badge}
            </div>
            <h1>{site.pastryPage.title}</h1>
            <p className="hero-sub">{site.pastryPage.subtitle}</p>
            <div className="hero-actions">
              <a href="#solicitar-presupuesto" className="btn btn-primary">
                Solicitar presupuesto
              </a>
              <Link to="/" className="btn btn-outline">
                Volver a la tienda
              </Link>
            </div>
          </div>
          <div className="card" style={{ borderRadius: 32, background: 'rgba(255,255,255,.75)' }}>
            <div style={{ borderRadius: 26, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg,#FFE6EE,#FFF0D5,#F0E7F6)' }}>
              <div className="benefit-icon" style={{ width: 96, height: 96, margin: '0 auto' }}>
                <CakeSlice size={48} />
              </div>
              <p className="font-display" style={{ marginTop: 24, fontSize: '1.875rem' }}>Solo por encargo</p>
              <p style={{ margin: '12px auto 0', maxWidth: '18rem', fontSize: 14, color: 'var(--color-text-muted)' }}>
                El valor se calcula según tamaño, diseño, cobertura, cantidad y fecha.
              </p>
              <div className="row" style={{ marginTop: 24, justifyContent: 'center' }}>
                <span className="chip">Fotos de referencia</span>
                <span className="chip">Presupuesto por kilos</span>
                <span className="chip">Atención por WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide page-pad" aria-labelledby="catalogo-pasteleria">
        <p className="eyebrow eyebrow-orange">{site.pastryPage.catalogEyebrow}</p>
        <h2 id="catalogo-pasteleria" className="section-title">{site.pastryPage.catalogTitle}</h2>
        <p style={{ marginTop: 12, maxWidth: '42rem', color: 'var(--color-text-muted)' }}>{site.pastryPage.catalogIntro}</p>

        <div style={{ marginTop: 36, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <article className="card" style={{ background: '#FFF0F5', borderColor: '#F1C7D5' }}>
            <p className="eyebrow eyebrow-primary">Tortas</p>
            <h3 className="font-display" style={{ fontSize: '1.5rem', marginTop: 8 }}>Torta de manteca</h3>
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: '#5F4F5C' }}>
              Bizcochuelo de manteca con relleno de trocitos de bizcochuelo y dulce repostero. Los pisos se humedecen con almíbar.
            </p>
            <p style={{ marginTop: 20, fontWeight: 800 }}>Coberturas a elección</p>
            <ul style={{ marginTop: 8, paddingLeft: 18, color: '#5F4F5C', fontSize: 14 }}>
              {COVERS.slice(0, 3).map(([, label]) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={() => { onCategory('torta'); document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Presupuestar esta torta
            </button>
          </article>
          <article className="card" style={{ background: '#F0E7F6', borderColor: '#E1D1E9' }}>
            <p className="eyebrow eyebrow-purple">Mesas dulces</p>
            <h3 className="font-display" style={{ fontSize: '1.5rem', marginTop: 8 }}>Tu tarta y tu mesa</h3>
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: '#5F4F5C' }}>
              Armá una lista con los postres que querés, la cantidad de cada uno, la forma de presentación y el presupuesto disponible.
            </p>
            <button type="button" className="btn btn-outline" style={{ marginTop: 20, width: '100%' }} onClick={() => { onCategory('mesa_dulce'); document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Armar mi mesa dulce
            </button>
          </article>
        </div>

        <div style={{ marginTop: 28, display: 'grid', gap: 20 }}>
          {tartas.map((item) => (
            <article key={item.id} className="card" style={{ display: 'grid', gap: 16, gridTemplateColumns: item.images.length ? 'minmax(0,1.1fr) minmax(0,.9fr)' : '1fr' }}>
              {item.images.length ? (
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(${Math.min(item.images.length, 2)}, 1fr)` }}>
                  {item.images.map((image) => (
                    <img key={image.src} src={image.src} alt={image.alt} loading="lazy" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 20 }} />
                  ))}
                </div>
              ) : null}
              <div>
                <p className="eyebrow eyebrow-orange">Molde Nº 22</p>
                <h3 className="font-display" style={{ fontSize: '1.5rem', marginTop: 8 }}>{item.name.replace(' · molde Nº 22', '')}</h3>
                <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>{item.description}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    onCategory('tarta')
                    setProduct(item.name)
                    document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Solicitar presupuesto
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="solicitar-presupuesto" className="container-wide" style={{ paddingBottom: 72, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <p className="eyebrow eyebrow-primary">Presupuesto personalizado</p>
          <h2 className="section-title">{site.pastryPage.formTitle}</h2>
          <p style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>{site.pastryPage.formIntro}</p>
          <div className="stack" style={{ marginTop: 28 }}>
            <div className="card" style={{ display: 'flex', gap: 12 }}>
              <CalendarCheck color="var(--color-primary)" />
              <div>
                <strong>Producción coordinada</strong>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Consultá con anticipación para confirmar fecha y disponibilidad.</p>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', gap: 12 }}>
              <Lock color="var(--color-green)" />
              <div>
                <strong>Datos protegidos</strong>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Tu información queda en este dispositivo y en el mensaje de WhatsApp.</p>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', gap: 12 }}>
              <MessageCircle color="var(--color-green)" />
              <div>
                <strong>Seguimiento directo</strong>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Al finalizar podés enviar la solicitud por WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>
        {sent ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 className="font-display" style={{ fontSize: '1.8rem' }}>Listo para enviar</h3>
            <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>
              Enviar el formulario no confirma el encargo ni fija el precio.
            </p>
            <a className="btn btn-green" style={{ marginTop: 24, width: '100%' }} href={sent} target="_blank" rel="noreferrer">
              Enviar solicitud por WhatsApp
            </a>
          </div>
        ) : (
          <form className="card form-grid two" onSubmit={onSubmit} noValidate>
            <label className="field">
              Tipo de encargo
              <select value={category} onChange={(e) => onCategory(e.target.value as typeof category)}>
                <option value="torta">Tortas</option>
                <option value="tarta">Tartas</option>
                <option value="mesa_dulce">Mesas dulces</option>
              </select>
            </label>
            <label className="field">
              Producto
              <select value={product} onChange={(e) => setProduct(e.target.value)}>
                {options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            {product === 'Torta personalizada' && (
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                Nombre o estilo de la torta
                <input value={form.cake_name} onChange={(e) => setForm({ ...form, cake_name: e.target.value })} />
              </label>
            )}
            {category === 'torta' && (
              <>
                <label className="field">
                  Cantidad de kilos
                  <input value={form.desired_kg} onChange={(e) => setForm({ ...form, desired_kg: e.target.value })} />
                </label>
                <label className="field">
                  Cobertura
                  <select value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })}>
                    {COVERS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="field">
              Fecha del evento
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </label>
            <label className="field">
              Teléfono de contacto / WhatsApp
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              Nombre
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}>
              Descripción del encargo
              <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Temática, colores, cantidad y cualquier detalle" />
            </label>
            <label className="choice" style={{ gridColumn: '1 / -1', minHeight: 'auto' }}>
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              Acepto coordinar el presupuesto por WhatsApp y la política de privacidad.
            </label>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
              Solicitar presupuesto
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
