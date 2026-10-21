const encoder = new TextEncoder()

export const SESSION_COOKIE = 'dm_admin_sess'
export const LOCK_COOKIE = 'dm_admin_lock'
export const SESSION_MAX_AGE_SEC = 60 * 60 * 12
const LOCK_AFTER = 5
const LOCK_MS = 15 * 60 * 1000
export const PBKDF2_ITERATIONS = 210000

function envAll() {
  return globalThis.process?.env ?? {}
}

function toBase64Url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function timingSafeEqual(a, b) {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

export function safeEqualString(a, b) {
  return timingSafeEqual(encoder.encode(a), encoder.encode(b))
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    out[key] = decodeURIComponent(value)
  }
  return out
}

async function hmacKey(secret) {
  const raw = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function sign(secret, data) {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return toBase64Url(sig)
}

async function verifySigned(secret, token) {
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  let expected
  try {
    expected = await sign(secret, data)
  } catch {
    return null
  }
  if (!safeEqualString(sig, expected)) return null
  return data
}

export function adminPathFromEnv(env = envAll()) {
  const raw = (env.ADMIN_PATH ?? '').trim().replace(/^\/+/, '').replace(/\/+$/, '')
  if (!/^editar-[A-Za-z0-9_-]{12,64}$/.test(raw)) return null
  return raw
}

export function isSecretAdminPath(pathname, adminPath) {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return clean === `/${adminPath}`
}

export async function createSessionToken(secret, maxAgeSec = SESSION_MAX_AGE_SEC) {
  const payload = JSON.stringify({ v: 1, exp: Date.now() + maxAgeSec * 1000 })
  const data = toBase64Url(encoder.encode(payload))
  const sig = await sign(secret, data)
  return `${data}.${sig}`
}

export async function verifySessionToken(secret, token) {
  if (!secret || !token) return false
  const data = await verifySigned(secret, token)
  if (!data) return false
  try {
    const json = new TextDecoder().decode(fromBase64Url(data))
    const parsed = JSON.parse(json)
    return parsed.v === 1 && typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

export async function readSession(request, secret) {
  const cookies = parseCookies(request.headers.get('cookie'))
  return verifySessionToken(secret, cookies[SESSION_COOKIE])
}

export async function readLock(request, secret) {
  const cookies = parseCookies(request.headers.get('cookie'))
  const token = cookies[LOCK_COOKIE]
  if (!token || !secret) return { n: 0, until: 0 }
  const data = await verifySigned(secret, token)
  if (!data) return { n: 0, until: 0 }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(data)))
    if (typeof parsed.n !== 'number' || typeof parsed.until !== 'number') return { n: 0, until: 0 }
    if (parsed.until > Date.now()) return parsed
    if (parsed.until && parsed.until <= Date.now()) return { n: 0, until: 0 }
    return { n: parsed.n, until: 0 }
  } catch {
    return { n: 0, until: 0 }
  }
}

export async function signLock(secret, lock) {
  const data = toBase64Url(encoder.encode(JSON.stringify(lock)))
  const sig = await sign(secret, data)
  return `${data}.${sig}`
}

export function nextLock(lock) {
  const n = lock.n + 1
  if (n >= LOCK_AFTER) return { n, until: Date.now() + LOCK_MS }
  return { n, until: 0 }
}

export function isLocked(lock) {
  return lock.until > Date.now()
}

export async function hashPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltCopy = new Uint8Array(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltCopy, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export async function verifyPassword(password, stored) {
  const parts = stored.split('$')
  if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') return false
  const iterations = Number(parts[2])
  if (!Number.isFinite(iterations) || iterations < 50_000) return false
  const salt = fromBase64Url(parts[3])
  const expected = fromBase64Url(parts[4])
  const actual = await hashPassword(password, salt, iterations)
  return timingSafeEqual(actual, expected)
}

export function cookieHeader(name, value, opts) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, opts.maxAge)}`,
    'SameSite=Strict',
  ]
  if (opts.httpOnly !== false) parts.push('HttpOnly')
  if (opts.secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookieHeader(name, secure) {
  return cookieHeader(name, '', { maxAge: 0, secure })
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export function env(name) {
  return envAll()[name] ?? ''
}
