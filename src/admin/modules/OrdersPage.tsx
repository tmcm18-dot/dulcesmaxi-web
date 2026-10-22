import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp, downloadCsv } from '../api'

const NEXT: Record<string, string[]> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
}

export default function OrdersPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const rows = db.orders.filter((o) => status === 'all' || o.status === status)
  const current = db.orders.find((o) => o.id === open)

  return (
    <div className="stack">
      <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="font-display">Pedidos</h1>
        <label className="field" style={{ minWidth: 180 }}>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            {['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-outline" onClick={() => void adminOp<{ csv: string }>('export_orders').then((r) => downloadCsv('pedidos.csv', r.csv))}>CSV</button>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nº</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={String(o.id)} onClick={() => { setOpen(String(o.id)); setNotes(String(o.internalNotes || '')) }} style={{ cursor: 'pointer' }}>
                <td>{String(o.number)}</td>
                <td>{String(o.createdAt).slice(0, 10)}</td>
                <td>{String(o.customer)}</td>
                <td>{formatPrice(Number(o.total))}</td>
                <td>{String(o.paymentMethod)}</td>
                <td>{String(o.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {current ? (
        <div className="admin-card stack">
          <h2>{String(current.number)}</h2>
          <p>{String(current.customer)} · {String(current.phone)} · {String(current.email)}</p>
          <p>{String(current.deliveryMethod)} {String(current.address || '')}</p>
          <p className="muted">{String(current.notes || '')}</p>
          {current.paymentMethod === 'mercadopago' ? <p>MP: {String(current.mpRef || 'sin referencia')} — cancelar no reembolsa.</p> : null}
          <ul>
            {((current.items as { name: string; quantity: number; price: number }[]) || []).map((item, i) => (
              <li key={i}>{item.quantity} × {item.name} · {formatPrice(item.price)}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(NEXT[String(current.status)] || []).map((s) => (
              <button key={s} type="button" className="btn btn-primary" onClick={() => void adminOp('transition_order_status', { orderId: current.id, status: s }).then(reload)}>
                Pasar a {s}
              </button>
            ))}
          </div>
          <label className="field">Notas internas
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button type="button" className="btn btn-outline" onClick={() => void adminOp('update_order_notes', { orderId: current.id, notes }).then(reload)}>Guardar notas</button>
        </div>
      ) : null}
    </div>
  )
}
