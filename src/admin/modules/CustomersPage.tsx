import { useMemo, useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp, downloadCsv } from '../api'

export default function CustomersPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const rows = useMemo(
    () =>
      db.customers.filter((c) => {
        const blob = `${c.name} ${c.email} ${c.phone}`.toLowerCase()
        return blob.includes(q.toLowerCase())
      }),
    [db.customers, q],
  )
  const current = db.customers.find((c) => c.id === open)
  const orders = db.orders.filter((o) => current && (o.email === current.email || o.phone === current.phone))

  return (
    <div className="stack">
      <div className="admin-card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <h1 className="font-display">Clientes</h1>
          <label className="field">Buscar<input value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void adminOp<{ csv: string }>('export_customers').then((r) => downloadCsv('clientes.csv', r.csv))}>CSV</button>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Pedidos</th><th>Gasto</th><th>Ticket</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={String(c.id)} style={{ cursor: 'pointer' }} onClick={() => { setOpen(String(c.id)); setNotes(String(c.notes || '')) }}>
                <td>{String(c.name)}</td>
                <td>{String(c.email || c.phone)}</td>
                <td>{String(c.orders || 0)}</td>
                <td>{formatPrice(Number(c.spent || 0))}</td>
                <td>{formatPrice(Number(c.orders) ? Number(c.spent) / Number(c.orders) : 0)}</td>
                <td>{String(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {current ? (
        <div className="admin-card stack">
          <h2>{String(current.name)}</h2>
          <p>Marketing: {current.marketing ? 'autorizado' : 'no'}</p>
          <label className="field">Notas internas<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => void adminOp('update_customer', { customerId: current.id, notes }).then(reload)}>Guardar notas</button>
            <button type="button" className="btn btn-outline" onClick={() => void adminOp('update_customer', { customerId: current.id, status: current.status === 'activo' ? 'inactivo' : 'activo' }).then(reload)}>
              {current.status === 'activo' ? 'Desactivar' : 'Activar'}
            </button>
          </div>
          <h3>Pedidos</h3>
          <ul>{orders.map((o) => <li key={String(o.id)}>{String(o.number)} · {String(o.status)} · {formatPrice(Number(o.total))}</li>)}</ul>
        </div>
      ) : null}
    </div>
  )
}
