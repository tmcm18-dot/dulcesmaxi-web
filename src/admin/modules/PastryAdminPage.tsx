import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

export default function PastryAdminPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const [quote, setQuote] = useState('')
  const [notes, setNotes] = useState('')
  const rows = db.pastryRequests.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    return `${r.customer} ${r.product} ${r.phone}`.toLowerCase().includes(q.toLowerCase())
  })
  const current = db.pastryRequests.find((r) => r.id === open)

  return (
    <div className="stack">
      <div className="admin-card stack">
        <h1 className="font-display">Pastelería por encargo</h1>
        <div className="admin-grid-2">
          <label className="field">Buscar<input value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <label className="field">Estado
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              {['nueva', 'en_revision', 'cotizada', 'confirmada', 'cerrada', 'cancelada'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Evento</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} style={{ cursor: 'pointer' }} onClick={() => { setOpen(String(r.id)); setQuote(String(r.quote || '')); setNotes(String(r.internalNotes || '')) }}>
                <td>{String(r.createdAt).slice(0, 10)}</td>
                <td>{String(r.customer)}</td>
                <td>{String(r.product)}</td>
                <td>{String(r.eventDate || '—')}</td>
                <td>{String(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {current ? (
        <div className="admin-card stack">
          <h2>{String(current.product)}</h2>
          <p>{String(current.customer)} · {String(current.phone)} · {String(current.email)}</p>
          <p>{String(current.description)}</p>
          <p>Kg: {String(current.kg || '—')} · cobertura {String(current.cover || '—')}</p>
          {current.phone ? (
            <a className="btn btn-primary" href={`https://wa.me/549${String(current.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
          ) : null}
          <label className="field">Estado
            <select value={String(current.status)} onChange={(e) => void adminOp('update_pastry_request', { requestId: current.id, status: e.target.value }).then(reload)}>
              {['nueva', 'en_revision', 'cotizada', 'confirmada', 'cerrada', 'cancelada'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">Presupuesto cotizado<input type="number" value={quote} onChange={(e) => setQuote(e.target.value)} /></label>
          <label className="field">Notas internas<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <button type="button" className="btn btn-primary" onClick={() => void adminOp('update_pastry_request', { requestId: current.id, quote, notes }).then(reload)}>
            Guardar cotización {quote ? `(${formatPrice(Number(quote))})` : ''}
          </button>
        </div>
      ) : null}
    </div>
  )
}
