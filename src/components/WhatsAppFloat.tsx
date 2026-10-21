import { MessageCircle } from 'lucide-react'
import { useSite } from '../context/SiteContext'
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
    >
      <MessageCircle size={24} />
    </a>
  )
}
