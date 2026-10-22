import { MessageCircle } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { loadConsent } from '../lib/storage'
import { storefront } from '../lib/storefront'
import { waLink } from '../lib/whatsapp'

export function WhatsAppFloat() {
  const { site } = useSite()
  return (
    <a
      className="wa-float"
      href={waLink(site.brand.whatsapp)}
      target="_blank"
      rel="noreferrer"
      aria-label="Consultar por WhatsApp"
      onClick={() => {
        if (loadConsent()) void storefront('track_event', { type: 'whatsapp', path: window.location.pathname })
      }}
    >
      <MessageCircle size={24} />
    </a>
  )
}
