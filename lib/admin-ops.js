import { emptyDb, loadDb, publicProduct, saveDb, uid } from './admin-db.js'

const CATEGORIES = new Set(['mermelada', 'dulce_regional', 'pasteleria', 'combo', 'licor', 'edicion_especial'])
const ORDER_FLOW = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
}
const PASTRY_STATES = new Set(['nueva', 'en_revision', 'cotizada', 'confirmada', 'cerrada', 'cancelada'])
const CART_STATES = new Set(['activo', 'inactivo', 'abandonado'])
const CUSTOMER_STATES = new Set(['activo', 'inactivo'])
const MOVE_TYPES = new Set(['entrada', 'salida', 'perdida', 'rotura', 'devolucion'])

function err(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function audit(db, action, detail) {
  db.audit.unshift({
    id: uid('aud'),
    at: new Date().toISOString(),
    action,
    detail,
    actor: 'admin',
  })
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeProduct(input, previous = {}) {
  const product = {
    id: previous.id || uid('prod'),
    sku: String(input.sku ?? previous.sku ?? '').trim(),
    name: String(input.name ?? previous.name ?? '').trim(),
    shortDescription: String(input.shortDescription ?? previous.shortDescription ?? ''),
    description: String(input.description ?? previous.description ?? ''),
    price: Math.round(num(input.price, previous.price)),
    compareAtPrice: Math.round(num(input.compareAtPrice, previous.compareAtPrice)),
    cost: Math.round(num(input.cost, previous.cost)),
    size: String(input.size ?? previous.size ?? ''),
    stock: Math.max(0, Math.round(num(input.stock, previous.stock))),
    lowStockThreshold: Math.max(0, Math.round(num(input.lowStockThreshold, previous.lowStockThreshold ?? 5))),
    expiresAt: String(input.expiresAt ?? previous.expiresAt ?? ''),
    category: String(input.category ?? previous.category ?? 'mermelada'),
    featured: Boolean(input.featured ?? previous.featured),
    imageUrl: String(input.imageUrl ?? previous.imageUrl ?? ''),
    imageAlt: String(input.imageAlt ?? previous.imageAlt ?? input.name ?? previous.name ?? ''),
    ingredients: String(input.ingredients ?? previous.ingredients ?? ''),
    allergens: String(input.allergens ?? previous.allergens ?? ''),
    conservation: String(input.conservation ?? previous.conservation ?? ''),
    badge: String(input.badge ?? previous.badge ?? ''),
    alcoholPercentage: num(input.alcoholPercentage, previous.alcoholPercentage),
    active: input.active === undefined ? previous.active !== false : Boolean(input.active),
  }
  if (!product.sku || !product.name) throw err('SKU y nombre son obligatorios')
  if (!CATEGORIES.has(product.category)) throw err('Categoría inválida')
  if (product.price < 0 || product.cost < 0) throw err('Precio y costo no pueden ser negativos')
  if (product.price > 0 && product.cost > 0 && product.price < product.cost) {
    throw err('El precio no puede ser inferior al costo')
  }
  if (product.category === 'licor' && product.alcoholPercentage <= 0) {
    throw err('Los licores deben declarar graduación alcohólica')
  }
  if (product.category === 'pasteleria') product.stock = 0
  if (product.imageUrl && !/^(\/|https?:|data:image\/)/.test(product.imageUrl)) {
    throw err('URL de imagen inválida')
  }
  if (product.imageUrl.startsWith('data:image/') && product.imageUrl.length > 900_000) {
    throw err('La imagen supera el tamaño máximo')
  }
  return product
}

function endingPrice(value, ending) {
  const n = Math.max(0, Math.round(value))
  if (ending === '90') return Math.floor(n / 100) * 100 + 90
  if (ending === '490') return Math.floor(n / 1000) * 1000 + 490
  if (ending === '990') return Math.floor(n / 1000) * 1000 + 990
  return n
}

function upsertCustomer(db, { name, email, phone, marketing }) {
  const key = (email || phone || name || '').toLowerCase()
  if (!key) return null
  let customer = db.customers.find(
    (c) => (email && c.email === email) || (phone && c.phone === phone),
  )
  if (!customer) {
    customer = {
      id: uid('cus'),
      name: name || 'Cliente',
      email: email || '',
      phone: phone || '',
      status: 'activo',
      notes: '',
      marketing: Boolean(marketing),
      createdAt: new Date().toISOString(),
      orders: 0,
      spent: 0,
    }
    db.customers.unshift(customer)
  } else {
    if (name) customer.name = name
    if (email) customer.email = email
    if (phone) customer.phone = phone
    if (marketing !== undefined) customer.marketing = Boolean(marketing)
  }
  return customer
}

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',')
    const row = {}
    headers.forEach((h, i) => {
      row[h] = (cols[i] || '').trim()
    })
    return row
  })
  return { headers, rows }
}

function applyStock(product, delta, reason, db) {
  const before = num(product.stock)
  const after = Math.max(0, before + delta)
  product.stock = after
  db.movements.unshift({
    id: uid('mov'),
    at: new Date().toISOString(),
    productId: product.id,
    sku: product.sku,
    name: product.name,
    type: delta >= 0 ? 'entrada' : 'salida',
    reason,
    quantity: Math.abs(delta),
    stockBefore: before,
    stockAfter: after,
  })
}

export async function runAdminOp(action, payload = {}, { role = 'admin' } = {}) {
  if (role !== 'admin') throw err('Se requiere rol administrador', 403)
  if (action !== 'load_data' && JSON.stringify(payload).length > 1_400_000) {
    throw err('La solicitud es demasiado grande', 413)
  }

  const db = await loadDb()

  switch (action) {
    case 'load_data':
      return { ok: true, data: db }

    case 'save_site': {
      db.site = payload.site || db.site
      audit(db, 'save_site', 'Actualizó textos y diseño del sitio')
      await saveDb(db)
      return { ok: true, data: db }
    }

    case 'save_product': {
      const incoming = payload.product || payload
      const existing = db.products.find((p) => p.id === incoming.id)
      const product = normalizeProduct(incoming, existing || {})
      const dup = db.products.find((p) => p.sku === product.sku && p.id !== product.id)
      if (dup) throw err(`El SKU ${product.sku} ya existe`)
      if (existing) {
        Object.assign(existing, product)
      } else {
        db.products.unshift(product)
      }
      audit(db, 'save_product', `${product.sku} · ${product.name}`)
      await saveDb(db)
      return { ok: true, product, data: db }
    }

    case 'upload_product_image': {
      const { productId, imageUrl } = payload
      const product = db.products.find((p) => p.id === productId)
      if (!product) throw err('Producto no encontrado', 404)
      if (!imageUrl || !String(imageUrl).startsWith('data:image/')) throw err('Imagen inválida')
      if (imageUrl.length > 900_000) throw err('La imagen supera el tamaño máximo')
      product.imageUrl = imageUrl
      audit(db, 'upload_product_image', product.sku)
      await saveDb(db)
      return { ok: true, product }
    }

    case 'import_products': {
      const { csv, confirm } = payload
      const { rows } = parseCsv(csv)
      if (rows.length > 200) throw err('Máximo 200 filas por importación')
      const errors = []
      const parsed = []
      rows.forEach((row, index) => {
        try {
          parsed.push(normalizeProduct(row, { id: uid('prod') }))
        } catch (e) {
          errors.push({ row: index + 2, message: e.message, sku: row.sku })
        }
      })
      if (!confirm) return { ok: true, preview: true, count: parsed.length, errors }
      if (errors.length) throw err(`Hay ${errors.length} filas con error; corregilas antes de confirmar`)
      const snapshot = JSON.parse(JSON.stringify(db.products))
      parsed.forEach((product) => {
        const dup = db.products.find((p) => p.sku === product.sku)
        if (dup) Object.assign(dup, { ...product, id: dup.id })
        else db.products.unshift(product)
      })
      db.importJobs.unshift({
        id: uid('imp'),
        at: new Date().toISOString(),
        count: parsed.length,
        snapshot,
      })
      db.importJobs = db.importJobs.slice(0, 5)
      audit(db, 'import_products', `${parsed.length} productos`)
      await saveDb(db)
      return { ok: true, count: parsed.length, data: db }
    }

    case 'undo_import': {
      const job = db.importJobs[0]
      if (!job?.snapshot) throw err('No hay una importación para revertir')
      db.products = job.snapshot
      db.importJobs.shift()
      audit(db, 'undo_import', job.id)
      await saveDb(db)
      return { ok: true, data: db }
    }

    case 'apply_prices': {
      const { scope = 'all', category, mode = 'markup', percent, ending = 'none', preview } = payload
      const pct = num(percent)
      if (pct <= 0 || pct > 90) throw err('El porcentaje debe estar entre 0 y 90')
      const targets = db.products.filter((p) => (scope === 'all' ? true : p.category === category))
      const results = targets.map((p) => {
        const cost = num(p.cost)
        let next = p.price
        if (mode === 'margin') next = cost / (1 - pct / 100)
        else next = cost * (1 + pct / 100)
        next = endingPrice(next, ending)
        if (cost > 0 && next < cost) next = cost
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          cost,
          priceBefore: p.price,
          priceAfter: next,
          margin: next ? Math.round(((next - cost) / next) * 1000) / 10 : 0,
        }
      })
      if (preview) return { ok: true, preview: true, results }
      results.forEach((row) => {
        const product = db.products.find((p) => p.id === row.id)
        if (product) product.price = row.priceAfter
      })
      audit(db, 'apply_prices', `${results.length} productos · ${mode} ${pct}%`)
      await saveDb(db)
      return { ok: true, results, data: db }
    }

    case 'adjust_inventory': {
      const { productId, type, quantity, reason } = payload
      if (!MOVE_TYPES.has(type)) throw err('Tipo de movimiento inválido')
      const qty = Math.round(num(quantity))
      if (qty <= 0) throw err('La cantidad debe ser positiva')
      const product = db.products.find((p) => p.id === productId)
      if (!product) throw err('Producto no encontrado', 404)
      const delta = type === 'entrada' || type === 'devolucion' ? qty : -qty
      applyStock(product, delta, `${type}: ${reason || ''}`.trim(), db)
      db.movements[0].type = type
      audit(db, 'adjust_inventory', `${product.sku} ${type} ${qty}`)
      await saveDb(db)
      return { ok: true, product, data: db }
    }

    case 'create_batch': {
      const { productId, quantity, unitCost, producedAt, expiresAt, notes } = payload
      const qty = Math.round(num(quantity))
      if (qty <= 0) throw err('La cantidad del lote debe ser positiva')
      const product = db.products.find((p) => p.id === productId)
      if (!product) throw err('Producto no encontrado', 404)
      const batch = {
        id: uid('lot'),
        productId,
        sku: product.sku,
        quantity: qty,
        unitCost: Math.round(num(unitCost, product.cost)),
        producedAt: producedAt || new Date().toISOString().slice(0, 10),
        expiresAt: expiresAt || '',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      }
      db.batches.unshift(batch)
      applyStock(product, qty, `lote ${batch.id}`, db)
      if (expiresAt && (!product.expiresAt || expiresAt < product.expiresAt)) product.expiresAt = expiresAt
      if (batch.unitCost) product.cost = batch.unitCost
      audit(db, 'create_batch', `${product.sku} x${qty}`)
      await saveDb(db)
      return { ok: true, batch, data: db }
    }

    case 'transition_order_status': {
      const order = db.orders.find((o) => o.id === payload.orderId)
      if (!order) throw err('Pedido no encontrado', 404)
      const next = payload.status
      const allowed = ORDER_FLOW[order.status] || []
      if (!allowed.includes(next)) throw err(`No se puede pasar de ${order.status} a ${next}`)
      if (next === 'confirmado' && !order.stockCommitted) {
        for (const item of order.items || []) {
          const product = db.products.find((p) => p.id === item.productId)
          if (product) applyStock(product, -Math.abs(item.quantity), `pedido ${order.number}`, db)
        }
        order.stockCommitted = true
      }
      if (next === 'cancelado' && order.stockCommitted) {
        for (const item of order.items || []) {
          const product = db.products.find((p) => p.id === item.productId)
          if (product) applyStock(product, Math.abs(item.quantity), `cancelación ${order.number}`, db)
        }
        order.stockCommitted = false
        order.cancelNote = 'Cancelado desde el panel. No se procesa reembolso de Mercado Pago.'
      }
      order.status = next
      order.updatedAt = new Date().toISOString()
      audit(db, 'transition_order_status', `${order.number} → ${next}`)
      await saveDb(db)
      return { ok: true, order, data: db }
    }

    case 'update_order_notes': {
      const order = db.orders.find((o) => o.id === payload.orderId)
      if (!order) throw err('Pedido no encontrado', 404)
      order.internalNotes = String(payload.notes || '')
      await saveDb(db)
      return { ok: true, order }
    }

    case 'update_customer': {
      const customer = db.customers.find((c) => c.id === payload.customerId)
      if (!customer) throw err('Cliente no encontrado', 404)
      if (payload.status && !CUSTOMER_STATES.has(payload.status)) throw err('Estado inválido')
      if (payload.status) customer.status = payload.status
      if (payload.notes !== undefined) customer.notes = String(payload.notes)
      if (payload.marketing !== undefined) customer.marketing = Boolean(payload.marketing)
      audit(db, 'update_customer', customer.email || customer.phone)
      await saveDb(db)
      return { ok: true, customer }
    }

    case 'update_cart': {
      const cart = db.carts.find((c) => c.id === payload.cartId)
      if (!cart) throw err('Carrito no encontrado', 404)
      if (payload.status && !CART_STATES.has(payload.status)) throw err('Estado de carrito inválido')
      if (payload.status) cart.status = payload.status
      cart.updatedAt = new Date().toISOString()
      await saveDb(db)
      return { ok: true, cart }
    }

    case 'refresh_cart_statuses': {
      const inactiveH = num(payload.inactiveHours, db.settings.cartInactiveHours)
      const abandonedH = num(payload.abandonedHours, db.settings.cartAbandonedHours)
      db.settings.cartInactiveHours = inactiveH
      db.settings.cartAbandonedHours = abandonedH
      const now = Date.now()
      db.carts.forEach((cart) => {
        if (cart.status === 'abandonado') return
        const hours = (now - new Date(cart.updatedAt || cart.createdAt).getTime()) / 36e5
        if (hours >= abandonedH) cart.status = 'abandonado'
        else if (hours >= inactiveH) cart.status = 'inactivo'
        else cart.status = 'activo'
      })
      audit(db, 'refresh_cart_statuses', `inactivo ${inactiveH}h / abandono ${abandonedH}h`)
      await saveDb(db)
      return { ok: true, data: db }
    }

    case 'update_pastry_request': {
      const req = db.pastryRequests.find((p) => p.id === payload.requestId)
      if (!req) throw err('Solicitud no encontrada', 404)
      if (payload.status && !PASTRY_STATES.has(payload.status)) throw err('Estado inválido')
      if (payload.status) req.status = payload.status
      if (payload.quote !== undefined) req.quote = Math.round(num(payload.quote))
      if (payload.notes !== undefined) req.internalNotes = String(payload.notes)
      req.updatedAt = new Date().toISOString()
      audit(db, 'update_pastry_request', req.id)
      await saveDb(db)
      return { ok: true, request: req }
    }

    case 'save_design': {
      const design = {
        id: payload.id || uid('des'),
        productId: payload.productId,
        title: String(payload.title || '').slice(0, 120),
        body: String(payload.body || '').slice(0, 500),
        cta: String(payload.cta || 'Pedir por WhatsApp').slice(0, 60),
        format: payload.format === 'story' ? 'story' : 'post',
        template: String(payload.template || 'frutilla'),
        background: String(payload.background || ''),
        updatedAt: new Date().toISOString(),
      }
      const idx = db.designs.findIndex((d) => d.id === design.id)
      if (idx >= 0) db.designs[idx] = design
      else db.designs.unshift(design)
      audit(db, 'save_design', design.title)
      await saveDb(db)
      return { ok: true, design }
    }

    case 'bulk_designs': {
      const ids = Array.isArray(payload.productIds) ? payload.productIds.slice(0, 20) : []
      const created = ids.map((productId) => {
        const product = db.products.find((p) => p.id === productId)
        const design = {
          id: uid('des'),
          productId,
          title: product?.name || 'Dulces Maxi',
          body: product?.shortDescription || 'Sabor artesanal de Salta.',
          cta: 'Pedir por WhatsApp',
          format: 'post',
          template: 'frutilla',
          background: '',
          updatedAt: new Date().toISOString(),
        }
        db.designs.unshift(design)
        return design
      })
      audit(db, 'bulk_designs', `${created.length} piezas`)
      await saveDb(db)
      return { ok: true, designs: created }
    }

    case 'generate_copy': {
      const product = db.products.find((p) => p.id === payload.productId)
      if (!product) throw err('Producto no encontrado', 404)
      const templates = [
        `Hoy es día de ${product.name}. ${product.shortDescription || 'Elaboración artesanal en Salta.'}`,
        `${product.name} · ${product.size}. Pedilo por WhatsApp y lo coordinamos.`,
        `Lote pequeño, sabor grande: ${product.name}. ${product.ingredients.split('\n')[0] || ''}`.trim(),
      ]
      return {
        ok: true,
        source: 'templates',
        copies: templates,
        note: 'No hay API de IA configurada: se usaron plantillas locales.',
      }
    }

    case 'generate_background': {
      const colors = {
        mermelada: ['#C51D5D', '#FFC83D'],
        dulce_regional: ['#69368C', '#FF7A1A'],
        pasteleria: ['#FFE6EE', '#C51D5D'],
        combo: ['#237347', '#FFC83D'],
        licor: ['#2A1830', '#C51D5D'],
      }
      const [a, b] = colors[payload.category] || colors.mermelada
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="860" cy="180" r="160" fill="rgba(255,255,255,.18)"/></svg>`
      return {
        ok: true,
        source: 'templates',
        background: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
        note: 'Fondo generado con plantilla local (sin API de IA).',
      }
    }

    case 'export_customers':
      return { ok: true, csv: toCsv(db.customers, ['name', 'email', 'phone', 'status', 'spent', 'orders', 'marketing']) }

    case 'export_orders':
      return {
        ok: true,
        csv: toCsv(db.orders, ['number', 'createdAt', 'status', 'customer', 'phone', 'total', 'paymentMethod']),
      }

    case 'audit_export':
      return { ok: true, csv: toCsv(db.audit, ['at', 'action', 'detail', 'actor']) }

    default:
      throw err(`Acción desconocida: ${action}`)
  }
}

function toCsv(rows, keys) {
  const head = keys.join(',')
  const body = (rows || [])
    .map((row) =>
      keys
        .map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')
  return `${head}\n${body}`
}

export async function runStorefront(action, payload = {}) {
  const db = await loadDb()
  if (action === 'create_order') {
    const items = Array.isArray(payload.items) ? payload.items.slice(0, 40) : []
    if (!items.length) throw err('El pedido no tiene artículos')
    const order = {
      id: uid('ord'),
      number: payload.number || `DM-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pendiente',
      customer: String(payload.customer || '').slice(0, 80),
      email: String(payload.email || '').slice(0, 120),
      phone: String(payload.phone || '').slice(0, 40),
      deliveryMethod: payload.deliveryMethod === 'retiro' ? 'retiro' : 'envio',
      address: String(payload.address || '').slice(0, 200),
      paymentMethod: payload.paymentMethod === 'mercadopago' ? 'mercadopago' : 'whatsapp',
      mpRef: '',
      notes: String(payload.notes || '').slice(0, 400),
      internalNotes: '',
      items,
      total: Math.round(num(payload.total)),
      stockCommitted: false,
    }
    db.orders.unshift(order)
    const customer = upsertCustomer(db, {
      name: order.customer,
      email: order.email,
      phone: order.phone,
      marketing: Boolean(payload.newsletter),
    })
    if (customer) {
      customer.orders += 1
      customer.spent += order.total
    }
    await saveDb(db)
    return { ok: true, orderId: order.id, number: order.number }
  }

  if (action === 'create_pastry_request') {
    const request = {
      id: uid('pas'),
      createdAt: new Date().toISOString(),
      status: 'nueva',
      category: String(payload.category || 'torta'),
      product: String(payload.product || ''),
      description: String(payload.description || '').slice(0, 800),
      kg: String(payload.kg || ''),
      eventDate: String(payload.eventDate || ''),
      cover: String(payload.cover || ''),
      customer: String(payload.customer || ''),
      phone: String(payload.phone || ''),
      email: String(payload.email || ''),
      quote: 0,
      internalNotes: '',
    }
    db.pastryRequests.unshift(request)
    upsertCustomer(db, { name: request.customer, email: request.email, phone: request.phone })
    await saveDb(db)
    return { ok: true, requestId: request.id }
  }

  if (action === 'sync_cart') {
    if (!payload.consent) return { ok: true, skipped: true }
    const items = Array.isArray(payload.items) ? payload.items.slice(0, 40) : []
    const total = items.reduce((sum, item) => sum + num(item.price) * num(item.quantity), 0)
    let cart = db.carts.find((c) => c.sessionId === payload.sessionId)
    if (!cart) {
      cart = {
        id: uid('cart'),
        sessionId: String(payload.sessionId || uid('ses')),
        createdAt: new Date().toISOString(),
        status: 'activo',
        consent: true,
      }
      db.carts.unshift(cart)
    }
    cart.items = items
    cart.total = total
    cart.updatedAt = new Date().toISOString()
    cart.status = items.length ? 'activo' : cart.status
    await saveDb(db)
    return { ok: true, cartId: cart.id }
  }

  if (action === 'track_event') {
    db.analytics.unshift({
      id: uid('ev'),
      at: new Date().toISOString(),
      type: String(payload.type || 'event').slice(0, 40),
      path: String(payload.path || '').slice(0, 120),
    })
    await saveDb(db)
    return { ok: true }
  }

  throw err(`Acción de tienda desconocida: ${action}`)
}

export { emptyDb, publicProduct }
