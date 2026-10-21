import { LOCK_COOKIE, SESSION_COOKIE, clearCookieHeader } from '../../lib/admin-auth.js'

export const config = { runtime: 'nodejs' }

function logoutResponse(request) {
  const secure = new URL(request.url).protocol === 'https:'
  const headers = new Headers({ Location: '/', 'cache-control': 'no-store' })
  headers.append('Set-Cookie', clearCookieHeader(SESSION_COOKIE, secure))
  headers.append('Set-Cookie', clearCookieHeader(LOCK_COOKIE, secure))
  return new Response(null, { status: 303, headers })
}

export function POST(request) {
  return logoutResponse(request)
}

export function GET(request) {
  return logoutResponse(request)
}
