import { env, readSession } from '../lib/admin-auth.js'
import { runAdminOp } from '../lib/admin-ops.js'

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
  return row.n > 80
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (limited(ip)) return json(429, { error: 'Demasiadas operaciones. Esperá un minuto.' })

  const secret = env('ADMIN_SESSION_SECRET')
  const ok = secret ? await readSession(request, secret) : false
  if (!ok) return json(401, { error: 'Sesión requerida' })

  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'JSON inválido' })
  }
  const action = String(body.action || '')
  try {
    const result = await runAdminOp(action, body.payload || body.data || {}, { role: 'admin' })
    return json(200, result)
  } catch (error) {
    return json(error.status || 400, { error: error.message || 'No se pudo completar' })
  }
}

export function GET() {
  return json(405, { error: 'Usá POST' })
}
