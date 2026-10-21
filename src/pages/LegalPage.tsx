import { TriangleAlert } from 'lucide-react'
import { Seo } from '../components/Seo'
import { useSite } from '../context/SiteContext'

const KEYS = {
  terminos: 'terminos',
  privacidad: 'privacidad',
  entregas: 'entregas',
  alcohol: 'alcohol',
} as const

export function LegalPage({ type }: { type: keyof typeof KEYS }) {
  const { site } = useSite()
  const page = site.legal[type]
  return (
    <article className="container page-pad" style={{ maxWidth: 896 }}>
      <Seo title={`${page.title} · ${site.brand.name}`} description={page.sections[0]?.body} />
      <div className="legal-warn">
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
          <TriangleAlert size={20} /> Borrador pendiente de revisión
        </p>
        <p style={{ marginTop: 4 }}>{site.legal.disclaimer}</p>
      </div>
      <h1 className="font-display" style={{ marginTop: 32, fontSize: '2.4rem' }}>{page.title}</h1>
      <div className="stack" style={{ marginTop: 32 }}>
        {page.sections.map((section) => (
          <section key={section.heading} className="card">
            <h2 className="font-display" style={{ fontSize: '1.25rem' }}>{section.heading}</h2>
            <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
