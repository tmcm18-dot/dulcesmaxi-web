import { CakeSlice, MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { waLink } from '../lib/whatsapp'

const FOOTER_YEAR = 2026

export function Footer() {
  const { site } = useSite()
  const year = FOOTER_YEAR

  return (
    <footer className="site-footer">
      <div className="container-wide footer-grid">
        <div>
          <p className="font-display" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#fff' }}>
            {site.brand.name}
          </p>
          <p className="footer-muted">{site.brand.footerBlurb}</p>
          <Link to="/pasteleria" className="nav-link" style={{ display: 'inline-flex', color: 'var(--color-yellow)', marginTop: 16 }}>
            <CakeSlice size={16} /> Pastelería por encargo
          </Link>
        </div>
        <div>
          <p className="footer-label">Entrega</p>
          <p className="footer-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} /> {site.brand.city}
          </p>
          <p className="footer-muted">Retiro o envío a coordinar.</p>
        </div>
        <div className="footer-right">
          <p className="footer-label">Atención</p>
          <a
            href={waLink(site.brand.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="nav-link"
            style={{ display: 'inline-flex', color: '#fff', marginTop: 12 }}
          >
            <MessageCircle size={16} /> WhatsApp {site.brand.phoneDisplay}
          </a>
        </div>
      </div>
      <div className="footer-legal">
        <div className="footer-legal-links">
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/terminos">Términos</Link>
          <Link to="/entregas">Entregas</Link>
          <Link to="/consumo-responsable">Consumo responsable</Link>
        </div>
        © {year} {site.brand.name} · Pastelería solo por encargo
      </div>
    </footer>
  )
}
