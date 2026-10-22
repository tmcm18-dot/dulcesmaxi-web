export type AdminDb = {
  updatedAt?: string
  settings: { cartAbandonedHours: number; cartInactiveHours: number; lowStockDefault: number }
  site: unknown
  products: Record<string, unknown>[]
  orders: Record<string, unknown>[]
  carts: Record<string, unknown>[]
  customers: Record<string, unknown>[]
  batches: Record<string, unknown>[]
  movements: Record<string, unknown>[]
  pastryRequests: Record<string, unknown>[]
  designs: Record<string, unknown>[]
  importJobs: Record<string, unknown>[]
  audit: Record<string, unknown>[]
  analytics: Record<string, unknown>[]
}

export async function adminOp<T = { ok: boolean; data?: AdminDb; error?: string }>(
  action: string,
  payload: unknown = {},
): Promise<T> {
  const res = await fetch('/api/admin-operations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
  return json
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function panelBasename() {
  const first = window.location.pathname.split('/').filter(Boolean)[0] || ''
  return first.startsWith('editar-') ? `/${first}` : ''
}
