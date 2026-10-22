import { loadDb, publicProduct } from '../lib/admin-db.js'

export const config = { runtime: 'nodejs' }

export async function GET() {
  const db = await loadDb()
  const products = (db.products || []).filter((p) => p.active !== false).map(publicProduct)
  return new Response(
    JSON.stringify({
      updatedAt: db.updatedAt,
      products,
      site: db.site,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=15',
      },
    },
  )
}
