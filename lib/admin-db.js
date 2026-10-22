import { get, put } from '@vercel/blob'
import { env } from './admin-auth.js'

const PATH = 'admin/db.json'
const token = () => env('BLOB_READ_WRITE_TOKEN') || undefined

function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function emptyDb() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: { cartAbandonedHours: 24, cartInactiveHours: 6, lowStockDefault: 5 },
    site: null,
    products: [
      {
        id: '6a96f4e2a00fd8b35701ee2b',
        sku: '3048',
        name: 'dulce de cayote en hebras 750 grs',
        shortDescription: 'dulce de cayote en hebras',
        description: 'Dulce de cayote en hebras, aromatizado con cáscara de naranja.',
        price: 8522,
        compareAtPrice: 0,
        cost: 4200,
        size: '750 g',
        stock: 3,
        lowStockThreshold: 5,
        expiresAt: daysFromNow(18),
        category: 'mermelada',
        featured: true,
        imageUrl: '/images/productos/cayote-750.webp',
        imageAlt: 'dulce de cayote en hebras 750 grs',
        ingredients: 'cayote\ncáscara de naranja\nazúcar',
        allergens: '',
        conservation: '',
        badge: '',
        alcoholPercentage: 0,
        active: true,
      },
      {
        id: '6a9209b679022bfcfe6b4b0c',
        sku: '0102',
        name: 'dulce de cayote en hebras 500 grs',
        shortDescription: 'dulce de cayote',
        description: 'Dulce de cayote de 500 g en envase de vidrio.',
        price: 5022,
        compareAtPrice: 0,
        cost: 2500,
        size: '500 g',
        stock: 0,
        lowStockThreshold: 5,
        expiresAt: daysFromNow(8),
        category: 'mermelada',
        featured: true,
        imageUrl: '/images/productos/cayote-500.webp',
        imageAlt: 'dulce de cayote en hebras 500 grs',
        ingredients: 'cayote\nazúcar\nvainilla',
        allergens: '',
        conservation: '',
        badge: '',
        alcoholPercentage: 0,
        active: true,
      },
      {
        id: '6a920b79ae1992db3ea627ed',
        sku: '0103',
        name: 'mermelada de kinotos',
        shortDescription: 'mermelada de kinotos',
        description:
          'Mermelada artesanal de kinotos en frasco de vidrio x 500 g. Libre de culpa y llena de satisfacción.',
        price: 5999,
        compareAtPrice: 0,
        cost: 3100,
        size: '500 g',
        stock: 30,
        lowStockThreshold: 8,
        expiresAt: daysFromNow(55),
        category: 'mermelada',
        featured: false,
        imageUrl: '/images/productos/kinotos.webp',
        imageAlt: 'mermelada de kinotos',
        ingredients: 'kinotos\nsemillas de kinotos (para la pectina)\nazúcar',
        allergens: '',
        conservation: '',
        badge: '',
        alcoholPercentage: 0,
        active: true,
      },
      {
        id: '6a92084fdc5b70c0a3d28b18',
        sku: '0101',
        name: 'dulce de frutilla',
        shortDescription: 'mermelada de frutilla',
        description:
          'Mermelada de frutilla 500 g en frasco de vidrio.\nUna vez abierto el frasco, consumir preferentemente dentro de los 30 días.',
        price: 6299,
        compareAtPrice: 0,
        cost: 3300,
        size: '500 g',
        stock: 24,
        lowStockThreshold: 6,
        expiresAt: daysFromNow(40),
        category: 'mermelada',
        featured: false,
        imageUrl: '/images/productos/frutilla.webp',
        imageAlt: 'dulce de frutilla',
        ingredients: 'frutilla\njugo de limón\nazúcar',
        allergens: '',
        conservation: '',
        badge: '',
        alcoholPercentage: 0,
        active: true,
      },
    ],
    orders: [],
    carts: [],
    customers: [],
    batches: [],
    movements: [],
    pastryRequests: [],
    designs: [],
    campaigns: [],
    importJobs: [],
    audit: [],
    analytics: [],
  }
}

async function seedIfMissing() {
  const seeded = emptyDb()
  try {
    await saveDb(seeded)
  } catch {
    /* sin token de Blob el panel igual arranca con el catálogo seed */
  }
  return seeded
}

export async function loadDb() {
  try {
    const file = await get(PATH, { access: 'private', token: token(), useCache: false })
    if (!file || file.statusCode !== 200 || !file.stream) return seedIfMissing()
    const text = await new Response(file.stream).text()
    const parsed = JSON.parse(text)
    const base = emptyDb()
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : base.products,
    }
  } catch {
    return seedIfMissing()
  }
}

export async function saveDb(db) {
  const next = { ...db, version: 1, updatedAt: new Date().toISOString() }
  if (next.audit?.length > 500) next.audit = next.audit.slice(0, 500)
  if (next.analytics?.length > 2000) next.analytics = next.analytics.slice(0, 2000)
  if (next.movements?.length > 1000) next.movements = next.movements.slice(0, 1000)
  await put(PATH, JSON.stringify(next), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: token(),
    contentType: 'application/json',
  })
  return next
}

export function publicProduct(product) {
  const { cost: _cost, ...rest } = product
  return rest
}

export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}
