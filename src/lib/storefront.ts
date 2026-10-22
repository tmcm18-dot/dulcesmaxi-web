export async function storefront(action: string, payload: unknown) {
  try {
    await fetch('/api/storefront', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
  } catch {
    /* la tienda sigue funcionando offline/local */
  }
}

export function analyticsSessionId() {
  const key = 'dulces_maxi_sid'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
