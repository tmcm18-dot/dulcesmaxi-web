export function formatPrice(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function isPastry(category: string) {
  return category === 'pasteleria'
}

export function hasAlcohol(product: { category: string; alcoholPercentage?: number }) {
  return product.category === 'licor' || Number(product.alcoholPercentage) > 0
}
