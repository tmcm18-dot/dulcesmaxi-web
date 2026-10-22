import { runStorefront } from '../lib/admin-ops.js'

export const config = { runtime: 'nodejs' }

const hits = new Map()

function limited(ip) {
  const now = Date.now()
  const row = hits.get(ip) || { n: 0, t: now }
  if (now - row.t > 60_000) {
    row.n = 0
    row.t = now
  }
  row.n += 1
  hits.set(ip, row)
  return row.n > 40
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (limited(ip)) return json(429, { error: 'Demasiados pedidos. Probá de nuevo en un minuto.' })
  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'JSON inválido' })
  }
  try {
    const result = await runStorefront(String(body.action || ''), body.payload || {})
    return json(200, result)
  } catch (error) {
    return json(error.status || 400, { error: error.message || 'No se pudo registrar' })
  }
}
