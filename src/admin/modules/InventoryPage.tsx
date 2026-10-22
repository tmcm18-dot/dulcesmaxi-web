import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

export default function InventoryPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [productId, setProductId] = useState(String(db.products[0]?.id || ''))
  const [type, setType] = useState('entrada')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [msg, setMsg] = useState('')
  const value = db.products.reduce((s, p) => s + Number(p.stock) * Number(p.cost || p.price || 0), 0)
  const low = db.products.filter((p) => Number(p.stock) <= Number(p.lowStockThreshold ?? 5))
  const expiring = db.products.filter((p) => p.expiresAt && String(p.expiresAt) <= new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10))

  return (
    <div className="stack">
      <div className="admin-card">
        <h1 className="font-display">Inventario</h1>
        <p>Valor estimado: <strong>{formatPrice(value)}</strong></p>
        {msg ? <p style={{ color: '#237347' }}>{msg}</p> : null}
      </div>
      <div className="admin-split">
        <article className="admin-card">
          <h2>Stock bajo</h2>
          <ul>{low.map((p) => <li key={String(p.id)}>{String(p.name)} ({String(p.stock)})</li>)}</ul>
        </article>
        <article className="admin-card">
          <h2>Por vencer (21 días)</h2>
          <ul>{expiring.map((p) => <li key={String(p.id)}>{String(p.name)} · {String(p.expiresAt)}</li>)}</ul>
        </article>
      </div>
      <form className="admin-card stack" onSubmit={(e) => { e.preventDefault(); void adminOp('adjust_inventory', { productId, type, quantity: qty, reason }).then(() => { setMsg('Movimiento registrado'); return reload() }) }}>
        <h2 className="font-display">Movimiento manual</h2>
        <label className="field">Producto
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {db.products.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.sku)} · {String(p.name)}</option>)}
          </select>
        </label>
        <label className="field">Tipo
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="perdida">Pérdida</option>
            <option value="rotura">Rotura</option>
            <option value="devolucion">Devolución</option>
          </select>
        </label>
        <label className="field">Cantidad<input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="field">Motivo<input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <button className="btn btn-primary" type="submit">Registrar</button>
      </form>
      <form className="admin-card stack" onSubmit={(e) => { e.preventDefault(); void adminOp('create_batch', { productId, quantity: qty, unitCost, expiresAt, notes: reason }).then(() => { setMsg('Lote creado'); return reload() }) }}>
        <h2 className="font-display">Lote de producción</h2>
        <label className="field">Costo unitario<input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></label>
        <label className="field">Vencimiento del lote<input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label>
        <button className="btn btn-outline" type="submit">Cargar lote (suma stock)</button>
      </form>
      <div className="admin-card admin-table-wrap">
        <h2 className="font-display">Historial</h2>
        <table className="admin-table">
          <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cant.</th><th>Antes</th><th>Después</th><th>Motivo</th></tr></thead>
          <tbody>
            {db.movements.slice(0, 40).map((m) => (
              <tr key={String(m.id)}>
                <td>{String(m.at).slice(0, 16)}</td>
                <td>{String(m.name)}</td>
                <td>{String(m.type)}</td>
                <td>{String(m.quantity)}</td>
                <td>{String(m.stockBefore)}</td>
                <td>{String(m.stockAfter)}</td>
                <td>{String(m.reason)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
