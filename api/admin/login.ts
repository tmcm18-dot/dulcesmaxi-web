import process from 'node:process'
import {
  LOCK_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  adminPathFromEnv,
  clearCookieHeader,
  clientIp,
  cookieHeader,
  createSessionToken,
  isLocked,
  nextLock,
  readLock,
  sameOrigin,
  signLock,
  verifyPassword,
} from '../../lib/admin-auth.js'

export const config = { runtime: 'nodejs' }

const ipAttempts = new Map<string, { n: number; until: number }>()

function loginHtml(error = '', lockedUntil = 0) {
  const locked = lockedUntil > Date.now()
  const message = locked
    ? 'Demasiados intentos. Probá de nuevo en unos minutos.'
    : error
  return `<!doctype html>
<html lang="es-AR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="theme-color" content="#C51D5D" />
    <title>Acceso · Dulces Maxi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,700&display=swap" rel="stylesheet" />
    <style>
      :root { --p:#C51D5D; --bg:#FFF7E8; --text:#2A1830; --muted:#6F6570; }
      * { box-sizing: border-box; }
      body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--bg); color:var(--text); font-family:"Nunito Sans",system-ui,sans-serif; padding:24px; }
      main { width:min(420px,100%); background:#fff; border:1px solid #E9D9D1; border-radius:20px; padding:28px; box-shadow:0 10px 30px rgba(42,24,48,.08); }
      h1 { font-family:Fredoka,system-ui,sans-serif; font-size:1.75rem; margin:0 0 8px; }
      p { color:var(--muted); margin:0 0 20px; }
      label { display:block; font-weight:700; font-size:14px; margin-bottom:16px; }
      input { width:100%; margin-top:6px; padding:12px 14px; border-radius:12px; border:1px solid #E9D9D1; font:inherit; }
      button { width:100%; border:0; border-radius:999px; padding:12px 18px; background:var(--p); color:#fff; font-weight:800; cursor:pointer; }
      button:disabled { opacity:.6; cursor:not-allowed; }
      .err { color:#B42318; font-weight:700; margin:0 0 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Ingresar</h1>
      <p>Editor de Dulces Maxi</p>
      ${message ? `<p class="err">${message}</p>` : ''}
      <form method="post" action="/api/admin/login" autocomplete="on">
        <label>Contraseña
          <input type="password" name="password" autocomplete="current-password" required ${locked ? 'disabled' : ''} />
        </label>
        <button type="submit" ${locked ? 'disabled' : ''}>Ingresar</button>
      </form>
    </main>
  </body>
</html>`
}

function html(status: number, body: string, cookies: string[] = [], extra: HeadersInit = {}) {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow',
    ...extra,
  })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(body, { status, headers })
}

function ipLocked(ip: string) {
  const row = ipAttempts.get(ip)
  if (!row) return false
  if (row.until > Date.now()) return true
  if (row.until && row.until <= Date.now()) {
    ipAttempts.delete(ip)
    return false
  }
  return false
}

function bumpIp(ip: string) {
  const prev = ipAttempts.get(ip) ?? { n: 0, until: 0 }
  const n = prev.n + 1
  const until = n >= 5 ? Date.now() + 15 * 60 * 1000 : 0
  ipAttempts.set(ip, { n, until })
}

export async function GET(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  const lock = secret ? await readLock(request, secret) : { n: 0, until: 0 }
  const ip = clientIp(request)
  const until = Math.max(lock.until, ipAttempts.get(ip)?.until ?? 0)
  return html(200, loginHtml('', until))
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return html(403, loginHtml('Pedido rechazado.'))
  }

  const adminPath = adminPathFromEnv()
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? ''
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (!adminPath || !passwordHash || !secret) {
    return html(503, loginHtml('El acceso no está configurado.'))
  }

  const secure = new URL(request.url).protocol === 'https:'
  const ip = clientIp(request)
  const lock = await readLock(request, secret)

  if (isLocked(lock) || ipLocked(ip)) {
    const until = Math.max(lock.until, ipAttempts.get(ip)?.until ?? 0)
    const headers: HeadersInit = until ? { 'Retry-After': String(Math.ceil((until - Date.now()) / 1000)) } : {}
    return html(429, loginHtml('', until), [], headers)
  }

  const form = await request.formData().catch(() => null)
  const password = String(form?.get('password') ?? '')
  const ok = password.length > 0 && (await verifyPassword(password, passwordHash))

  if (!ok) {
    bumpIp(ip)
    const next = nextLock(lock)
    const token = await signLock(secret, next)
    await new Promise((r) => setTimeout(r, 400))
    const cookies = [cookieHeader(LOCK_COOKIE, token, { maxAge: 15 * 60, secure })]
    if (isLocked(next)) {
      return html(429, loginHtml('', next.until), cookies, {
        'Retry-After': String(Math.ceil((next.until - Date.now()) / 1000)),
      })
    }
    return html(401, loginHtml('Contraseña incorrecta.'), cookies)
  }

  ipAttempts.delete(ip)
  const session = await createSessionToken(secret)
  const cookies = [
    cookieHeader(SESSION_COOKIE, session, { maxAge: SESSION_MAX_AGE_SEC, secure }),
    clearCookieHeader(LOCK_COOKIE, secure),
  ]
  const headers = new Headers({ Location: `/${adminPath}`, 'cache-control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers })
}
