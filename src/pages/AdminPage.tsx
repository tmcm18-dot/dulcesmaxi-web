import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  LogOut,
  Palette,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_PASSWORD } from '../content/defaultSite'
import { useSite } from '../context/SiteContext'
import { uid } from '../lib/format'
import { fileToCompressedDataUrl, isAdminSession, resetSite, setAdminSession } from '../lib/storage'
import type { HomeSection, Product, SectionType, SiteColors, SiteContent } from '../types'

const TABS = [
  ['textos', 'Textos'],
  ['productos', 'Productos'],
  ['secciones', 'Secciones'],
  ['colores', 'Colores'],
  ['datos', 'Exportar'],
] as const

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'hero', label: 'Portada' },
  { value: 'categories', label: 'Categorías' },
  { value: 'featured', label: 'Destacados' },
  { value: 'catalog', label: 'Catálogo' },
  { value: 'pastryCta', label: 'CTA pastelería' },
  { value: 'combosCta', label: 'CTA combos' },
  { value: 'benefits', label: 'Beneficios' },
  { value: 'reviews', label: 'Reseñas' },
  { value: 'custom', label: 'Sección libre' },
]

const COLOR_FIELDS: { key: keyof SiteColors; label: string }[] = [
  { key: 'primary', label: 'Primario' },
  { key: 'primaryDark', label: 'Primario oscuro' },
  { key: 'orange', label: 'Naranja' },
  { key: 'yellow', label: 'Amarillo' },
  { key: 'green', label: 'Verde' },
  { key: 'purple', label: 'Violeta' },
  { key: 'background', label: 'Fondo' },
  { key: 'backgroundSoft', label: 'Fondo suave' },
  { key: 'text', label: 'Texto' },
  { key: 'textMuted', label: 'Texto secundario' },
  { key: 'border', label: 'Bordes' },
  { key: 'footer', label: 'Footer' },
]

function emptyProduct(): Product {
  return {
    id: uid('prod'),
    sku: '',
    name: 'Nuevo producto',
    shortDescription: '',
    description: '',
    price: 0,
    compareAtPrice: 0,
    size: '500 g',
    stock: 0,
    category: 'mermelada',
    featured: false,
    imageUrl: '',
    imageAlt: '',
    ingredients: '',
    allergens: '',
    conservation: '',
    badge: '',
    alcoholPercentage: 0,
    active: true,
  }
}

function emptySection(): HomeSection {
  return {
    id: uid('sec'),
    type: 'custom',
    enabled: true,
    title: 'Nueva sección',
    eyebrow: '',
    body: '',
    ctaLabel: '',
    ctaHref: '/',
    imageUrl: '',
  }
}

export function AdminPage() {
  const { site, setSite } = useSite()
  const [authed, setAuthed] = useState(() => isAdminSession())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('textos')
  const [draft, setDraft] = useState<SiteContent>(site)
  const [status, setStatus] = useState('')

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(site), [draft, site])

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAdminSession(true)
      setAuthed(true)
      setError('')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const persist = (next = draft) => {
    setSite(next)
    setDraft(next)
    setStatus('Cambios guardados en este navegador.')
  }

  const onImage = async (file: File | undefined, apply: (url: string) => void) => {
    if (!file) return
    const url = await fileToCompressedDataUrl(file)
    apply(url)
  }

  if (!authed) {
    return (
      <main className="empty" style={{ minHeight: '100vh' }}>
        <div className="benefit-icon" style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16, background: 'var(--color-primary)', color: '#fff' }}>
          →
        </div>
        <h1 className="font-display" style={{ fontSize: '2rem' }}>Ingresar a administración</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Acceso exclusivo para gestionar Dulces Maxi</p>
        <form
          className="card"
          style={{ maxWidth: 420, margin: '24px auto', textAlign: 'left' }}
          onSubmit={(e) => {
            e.preventDefault()
            login()
          }}
        >
          <label className="field">
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p style={{ color: '#B42318', fontWeight: 700 }}>{error}</p> : null}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
            Ingresar
          </button>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Contraseña inicial: <code>maxi2026</code>
          </p>
        </form>
        <Link to="/" className="back-link">Volver a la tienda</Link>
      </main>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-top-inner">
          <Link to="/" className="icon-round" style={{ width: 44, height: 44, color: '#fff' }} aria-label="Volver a la tienda">
            <ArrowLeft />
          </Link>
          <div>
            <p className="font-display" style={{ fontSize: '1.2rem' }}>Dulces Maxi</p>
            <p style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-yellow)' }}>
              Editor de página
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => persist()} disabled={!dirty}>
              <Save size={16} /> Guardar
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' }}
              onClick={() => {
                setAdminSession(false)
                setAuthed(false)
              }}
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>
      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Módulos del editor">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <main className="admin-main">
          {status ? <p className="card" style={{ background: '#F4FAF5' }}>{status}</p> : null}

          {tab === 'textos' && (
            <div className="admin-card stack">
              <h1 className="font-display">Textos de la tienda</h1>
              {([
                ['brand.name', 'Nombre'],
                ['brand.tagline', 'Eslogan'],
                ['brand.topBar', 'Barra superior'],
                ['brand.city', 'Ciudad'],
                ['brand.phoneDisplay', 'Teléfono visible'],
                ['brand.whatsapp', 'WhatsApp (código país)'],
                ['brand.demoNote', 'Nota de demostración'],
                ['brand.footerBlurb', 'Texto del footer'],
                ['brand.seoTitle', 'Título SEO'],
                ['brand.seoDescription', 'Descripción SEO'],
                ['hero.badge', 'Hero · etiqueta'],
                ['hero.title', 'Hero · título'],
                ['hero.subtitle', 'Hero · subtítulo'],
                ['hero.ctaPrimary', 'Hero · botón principal'],
                ['hero.ctaWhatsapp', 'Hero · botón WhatsApp'],
                ['hero.strawberryLabel', 'Etiqueta foto frutilla'],
                ['reviews.title', 'Reseñas · título'],
                ['reviews.body', 'Reseñas · texto'],
                ['pastryPage.title', 'Pastelería · título'],
                ['pastryPage.subtitle', 'Pastelería · subtítulo'],
              ] as const).map(([path, label]) => {
                const [group, key] = path.split('.') as [keyof SiteContent, string]
                const groupValue = draft[group] as Record<string, string>
                return (
                  <label key={path} className="field">
                    {label}
                    {key.includes('subtitle') || key.includes('Description') || key.includes('body') || key.includes('Blurb') ? (
                      <textarea
                        rows={3}
                        value={groupValue[key] || ''}
                        onChange={(e) =>
                          setDraft({ ...draft, [group]: { ...groupValue, [key]: e.target.value } })
                        }
                      />
                    ) : (
                      <input
                        value={groupValue[key] || ''}
                        onChange={(e) =>
                          setDraft({ ...draft, [group]: { ...groupValue, [key]: e.target.value } })
                        }
                      />
                    )}
                  </label>
                )
              })}
            </div>
          )}

          {tab === 'productos' && (
            <div>
              <div className="row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
                <h1 className="font-display">Productos</h1>
                <button type="button" className="btn btn-primary" onClick={() => setDraft({ ...draft, products: [emptyProduct(), ...draft.products] })}>
                  <Plus size={16} /> Añadir producto
                </button>
              </div>
              {draft.products.map((product, index) => (
                <article key={product.id} className="admin-card">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{product.name}</strong>
                    <button type="button" className="btn btn-outline" onClick={() => setDraft({ ...draft, products: draft.products.filter((item) => item.id !== product.id) })}>
                      <Trash2 size={16} /> Quitar
                    </button>
                  </div>
                  <div className="form-grid two" style={{ marginTop: 12 }}>
                    {(['name', 'sku', 'size', 'shortDescription'] as const).map((key) => (
                      <label key={key} className="field">
                        {key}
                        <input
                          value={product[key]}
                          onChange={(e) => {
                            const products = draft.products.slice()
                            products[index] = { ...product, [key]: e.target.value }
                            setDraft({ ...draft, products })
                          }}
                        />
                      </label>
                    ))}
                    <label className="field">
                      Precio
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, price: Number(e.target.value) }
                          setDraft({ ...draft, products })
                        }}
                      />
                    </label>
                    <label className="field">
                      Stock
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, stock: Number(e.target.value) }
                          setDraft({ ...draft, products })
                        }}
                      />
                    </label>
                    <label className="field">
                      Categoría
                      <select
                        value={product.category}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, category: e.target.value as Product['category'] }
                          setDraft({ ...draft, products })
                        }}
                      >
                        {Object.entries(draft.categoryLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="choice">
                      <input
                        type="checkbox"
                        checked={product.featured}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, featured: e.target.checked }
                          setDraft({ ...draft, products })
                        }}
                      />
                      Destacado
                    </label>
                    <label className="choice">
                      <input
                        type="checkbox"
                        checked={product.active}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, active: e.target.checked }
                          setDraft({ ...draft, products })
                        }}
                      />
                      Visible
                    </label>
                    <label className="field" style={{ gridColumn: '1 / -1' }}>
                      Descripción
                      <textarea
                        rows={3}
                        value={product.description}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, description: e.target.value }
                          setDraft({ ...draft, products })
                        }}
                      />
                    </label>
                    <label className="field" style={{ gridColumn: '1 / -1' }}>
                      Ingredientes
                      <textarea
                        rows={2}
                        value={product.ingredients}
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, ingredients: e.target.value }
                          setDraft({ ...draft, products })
                        }}
                      />
                    </label>
                    <label className="field" style={{ gridColumn: '1 / -1' }}>
                      Imagen (URL o archivo)
                      <input
                        value={product.imageUrl.startsWith('data:') ? '' : product.imageUrl}
                        placeholder="https://… o /images/…"
                        onChange={(e) => {
                          const products = draft.products.slice()
                          products[index] = { ...product, imageUrl: e.target.value }
                          setDraft({ ...draft, products })
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onImage(e.target.files?.[0], (url) => {
                            const products = draft.products.slice()
                            products[index] = { ...product, imageUrl: url }
                            setDraft({ ...draft, products })
                          })
                        }
                      />
                      {product.imageUrl ? <img src={product.imageUrl} alt="" style={{ marginTop: 8, width: 120, height: 150, objectFit: 'cover', borderRadius: 12 }} /> : null}
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'secciones' && (
            <div>
              <div className="row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
                <h1 className="font-display">Secciones del inicio</h1>
                <button type="button" className="btn btn-primary" onClick={() => setDraft({ ...draft, sections: [...draft.sections, emptySection()] })}>
                  <Plus size={16} /> Añadir sección
                </button>
              </div>
              {draft.sections.map((section, index) => (
                <article key={section.id} className="section-item" style={{ marginBottom: 12 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{SECTION_TYPES.find((item) => item.value === section.type)?.label || section.type}</strong>
                    <div className="row">
                      <button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => {
                        const sections = draft.sections.slice()
                        ;[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]
                        setDraft({ ...draft, sections })
                      }}><ArrowUp size={16} /></button>
                      <button type="button" className="btn btn-outline" disabled={index === draft.sections.length - 1} onClick={() => {
                        const sections = draft.sections.slice()
                        ;[sections[index + 1], sections[index]] = [sections[index], sections[index + 1]]
                        setDraft({ ...draft, sections })
                      }}><ArrowDown size={16} /></button>
                      <button type="button" className="btn btn-outline" onClick={() => setDraft({ ...draft, sections: draft.sections.filter((item) => item.id !== section.id) })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <label className="choice">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => {
                        const sections = draft.sections.slice()
                        sections[index] = { ...section, enabled: e.target.checked }
                        setDraft({ ...draft, sections })
                      }}
                    />
                    Visible
                  </label>
                  <label className="field">
                    Tipo
                    <select
                      value={section.type}
                      onChange={(e) => {
                        const sections = draft.sections.slice()
                        sections[index] = { ...section, type: e.target.value as SectionType }
                        setDraft({ ...draft, sections })
                      }}
                    >
                      {SECTION_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  {(['eyebrow', 'title', 'body', 'ctaLabel', 'ctaHref'] as const).map((key) => (
                    <label key={key} className="field">
                      {key}
                      {key === 'body' ? (
                        <textarea rows={3} value={section[key]} onChange={(e) => {
                          const sections = draft.sections.slice()
                          sections[index] = { ...section, [key]: e.target.value }
                          setDraft({ ...draft, sections })
                        }} />
                      ) : (
                        <input value={section[key]} onChange={(e) => {
                          const sections = draft.sections.slice()
                          sections[index] = { ...section, [key]: e.target.value }
                          setDraft({ ...draft, sections })
                        }} />
                      )}
                    </label>
                  ))}
                  {section.type === 'custom' && (
                    <label className="field">
                      Imagen
                      <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0], (url) => {
                        const sections = draft.sections.slice()
                        sections[index] = { ...section, imageUrl: url }
                        setDraft({ ...draft, sections })
                      })} />
                    </label>
                  )}
                </article>
              ))}
            </div>
          )}

          {tab === 'colores' && (
            <div className="admin-card stack">
              <h1 className="font-display"><Palette size={20} /> Colores de marca</h1>
              {COLOR_FIELDS.map((field) => (
                <label key={field.key} className="color-input">
                  <input
                    type="color"
                    value={draft.colors[field.key]}
                    onChange={(e) => setDraft({ ...draft, colors: { ...draft.colors, [field.key]: e.target.value } })}
                  />
                  <span>{field.label}</span>
                  <code>{draft.colors[field.key]}</code>
                </label>
              ))}
            </div>
          )}

          {tab === 'datos' && (
            <div className="admin-card stack">
              <h1 className="font-display">Exportar e importar</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                El contenido vive en localStorage. Descargá un JSON para respaldarlo o cargalo en otro navegador.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'dulces-maxi-contenido.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download size={16} /> Exportar JSON
                </button>
                <label className="btn btn-outline">
                  <Upload size={16} /> Importar JSON
                  <input
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const parsed = JSON.parse(await file.text()) as SiteContent
                      if (parsed.version !== 1) {
                        setStatus('El archivo no es un respaldo válido.')
                        return
                      }
                      persist(parsed)
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const next = resetSite()
                    persist(next)
                    setStatus('Se restauró el contenido original.')
                  }}
                >
                  Restaurar original
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
