import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

export default function CartsPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [filter, setFilter] = useState('all')
  const rows = db.carts.filter((c) => filter === 'all' || c.status === filter)
  return (
    <div className="stack">
      <div className="admin-card stack">
        <h1 className="font-display">Carritos</h1>
        <p className="muted">Solo carritos con consentimiento analítico. El panel no envía recordatorios por WhatsApp.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="abandonado">Abandonados</option>
          </select>
          <button type="button" className="btn btn-outline" onClick={() => void adminOp('refresh_cart_statuses', {}).then(reload)}>
            Recalcular inactividad
          </button>
        </div>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Actualizado</th><th>Hace</th><th>Estado</th><th>Ítems</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={String(c.id)}>
                <td>{String(c.updatedAt || c.createdAt).slice(0, 16)}</td>
                <td>{Math.max(0, Math.round((Date.now() - new Date(String(c.updatedAt || c.createdAt)).getTime()) / 36e5))} h</td>
                <td>{String(c.status)}</td>
                <td>{Array.isArray(c.items) ? c.items.length : 0}</td>
                <td>{formatPrice(Number(c.total || 0))}</td>
                <td>
                  {['activo', 'inactivo', 'abandonado'].map((s) => (
                    <button key={s} type="button" className="btn btn-outline" style={{ marginRight: 4 }} onClick={() => void adminOp('update_cart', { cartId: c.id, status: s }).then(reload)}>
                      {s}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
