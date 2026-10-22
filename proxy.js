import { next, rewrite } from '@vercel/functions'
import { adminPathFromEnv, env, isSecretAdminPath, readSession } from './lib/admin-auth.js'

export const config = {
  runtime: 'nodejs',
}

function notFound() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
  })
}

export default async function proxy(request) {
  const url = new URL(request.url)
  const { pathname } = url
  const secret = env('ADMIN_SESSION_SECRET')
  const adminPath = adminPathFromEnv()
  const sessionOk = secret ? await readSession(request, secret) : false

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    url.pathname = '/'
    url.search = ''
    return Response.redirect(url, 302)
  }

  if (pathname === '/editor.html' || pathname.startsWith('/editor.html/') || pathname === '/editor') {
    if (!sessionOk) return notFound()
    return rewrite(new URL('/editor.html', url.origin))
  }

  if (adminPath && isSecretAdminPath(pathname, adminPath)) {
    if (sessionOk) {
      return rewrite(new URL('/editor.html', url.origin))
    }
    return rewrite(new URL('/api/admin/login', url.origin))
  }

  return next()
}
