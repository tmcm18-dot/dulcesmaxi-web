import { formatPrice } from './format'
import type { CartItem } from '../types'

export function waLink(phone: string, text?: string) {
  const base = `https://wa.me/${phone}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export function orderWhatsAppMessage(opts: {
  orderNumber: string
  customer: string
  items: CartItem[]
  total: number
  deliveryMethod: 'envio' | 'retiro'
  address?: string
  notes?: string
  paymentMethod?: 'whatsapp' | 'mercadopago'
}) {
  const lines = opts.items.map(
    (item) =>
      `• ${item.quantity} x ${item.name} (${item.size || 'sin presentación'}) — ${formatPrice(item.price * item.quantity)}`,
  )
  return [
    '¡Hola! Quiero confirmar este pedido en Dulces Maxi:',
    '',
    `Pedido: ${opts.orderNumber}`,
    `Cliente: ${opts.customer}`,
    ...lines,
    '',
    `Total: ${formatPrice(opts.total)}`,
    `Entrega: ${opts.deliveryMethod === 'retiro' ? 'Retiro a coordinar' : 'Envío a coordinar'}`,
    opts.address ? `Dirección: ${opts.address}` : null,
    opts.paymentMethod === 'mercadopago' ? 'Pago preferido: Mercado Pago (a coordinar).' : 'Pago: coordinar por WhatsApp.',
    opts.notes ? `Notas: ${opts.notes}` : null,
    '',
    'Quedo a la espera de la confirmación de disponibilidad, envío y forma de pago.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function pastryWhatsAppMessage(opts: {
  category: string
  product: string
  description: string
  name: string
  phone: string
  eventDate?: string
  kg?: string
}) {
  return [
    '¡Hola! Quiero solicitar un presupuesto de pastelería en Dulces Maxi.',
    '',
    `Tipo: ${opts.category}`,
    `Producto: ${opts.product}`,
    opts.kg ? `Kilos: ${opts.kg}` : null,
    opts.eventDate ? `Fecha: ${opts.eventDate}` : null,
    opts.description ? `Detalle: ${opts.description}` : null,
    '',
    `Nombre: ${opts.name}`,
    `Teléfono: ${opts.phone}`,
  ]
    .filter(Boolean)
    .join('\n')
}
