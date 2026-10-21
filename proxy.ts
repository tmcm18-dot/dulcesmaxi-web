import process from 'node:process'
import { next, rewrite } from '@vercel/functions'
import { adminPathFromEnv, isSecretAdminPath, readSession } from './lib/admin-auth.js'

export const config = {
  runtime: 'nodejs',
}

function notFound() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
  })
}

export default async function proxy(request: Request) {
  const url = new URL(request.url)
  const { pathname } = url
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  const adminPath = adminPathFromEnv()
  const sessionOk = secret ? await readSession(request, secret) : false

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    url.pathname = '/'
    url.search = ''
    return Response.redirect(url, 302)
  }

  if (pathname === '/editor.html' || pathname === '/editor') {
    if (!sessionOk) return notFound()
    url.pathname = '/editor.html'
    url.search = ''
    return rewrite(url)
  }

  if (adminPath && isSecretAdminPath(pathname, adminPath)) {
    if (sessionOk) {
      url.pathname = '/editor.html'
      url.search = ''
      return rewrite(url)
    }
    url.pathname = '/api/admin/login'
    return rewrite(url)
  }

  return next()
}
