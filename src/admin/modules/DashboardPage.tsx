import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp, downloadCsv } from '../api'

function inPeriod(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() < days * 86400000
}

export default function DashboardPage({ db }: { db: AdminDb }) {
  const [days, setDays] = useState(30)
  const orders = db.orders.filter((o) => o.status !== 'cancelado' && inPeriod(String(o.createdAt), days))
  const prev = db.orders.filter(
    (o) =>
      o.status !== 'cancelado' &&
      inPeriod(String(o.createdAt), days * 2) &&
      !inPeriod(String(o.createdAt), days),
  )
  const sales = orders.reduce((s, o) => s + Number(o.total || 0), 0)
  const prevSales = prev.reduce((s, o) => s + Number(o.total || 0), 0)
  const costs = orders.reduce((s, o) => {
    const items = (o.items as { productId: string; quantity: number }[]) || []
    return (
      s +
      items.reduce((acc, item) => {
        const p = db.products.find((x) => x.id === item.productId)
        return acc + Number(p?.cost || 0) * Number(item.quantity || 0)
      }, 0)
    )
  }, 0)
  const profit = sales - costs
  const ticket = orders.length ? sales / orders.length : 0
  const margin = sales ? (profit / sales) * 100 : 0
  const wa = db.analytics.filter((e) => e.type === 'whatsapp' && inPeriod(String(e.at), days)).length
  const conversion = wa ? (orders.length / wa) * 100 : 0
  const alerts = [
    ...db.products.filter((p) => Number(p.stock) <= Number(p.lowStockThreshold ?? 5)).map((p) => `Stock bajo: ${p.name}`),
    ...db.products
      .filter((p) => p.expiresAt && String(p.expiresAt) <= new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10))
      .map((p) => `Vence pronto: ${p.name}`),
    ...db.products.filter((p) => Number(p.price) > 0 && Number(p.cost) > 0 && Number(p.price) < Number(p.cost)).map((p) => `Bajo costo: ${p.name}`),
    ...db.products.filter((p) => !p.imageUrl).map((p) => `Sin foto: ${p.name}`),
  ]
  const top = [...db.products].sort((a, b) => Number(b.stock) - Number(a.stock)).slice(0, 4)

  const exportCsv = async () => {
    const csv = [
      'metrica,valor',
      `ventas,${sales}`,
      `costos,${costs}`,
      `ganancia,${profit}`,
      `pedidos,${orders.length}`,
      `ticket,${Math.round(ticket)}`,
      `margen,${margin.toFixed(1)}`,
      `whatsapp,${wa}`,
    ].join('\n')
    downloadCsv('dashboard-dulces-maxi.csv', csv)
  }

  const exportPdf = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<pre>Dashboard Dulces Maxi\nVentas ${sales}\nGanancia ${profit}\nPedidos ${orders.length}</pre>`)
    w.print()
  }

  const exportAudit = async () => {
    const res = await adminOp<{ csv: string }>('audit_export')
    downloadCsv('auditoria.csv', res.csv)
  }

  const delta = prevSales ? Math.round(((sales - prevSales) / prevSales) * 100) : 0

  return (
    <div className="stack">
      <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display">Dashboard</h1>
          <p className="muted">Últimos {days} días vs período anterior ({delta}%).</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="field">
            Período
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          </label>
          <button type="button" className="btn btn-outline" onClick={() => void exportCsv()}>CSV</button>
          <button type="button" className="btn btn-outline" onClick={exportPdf}>PDF</button>
          <button type="button" className="btn btn-outline" onClick={() => void exportAudit()}>Auditoría</button>
        </div>
      </div>
      <div className="admin-metrics">
        {[
          ['Facturación', formatPrice(sales)],
          ['Costos', formatPrice(costs)],
          ['Ganancia est.', formatPrice(profit)],
          ['Pedidos', String(orders.length)],
          ['Ticket promedio', formatPrice(ticket)],
          ['Margen', `${margin.toFixed(1)}%`],
          ['Clics WhatsApp', String(wa)],
          ['Conversión est.', `${conversion.toFixed(1)}%`],
        ].map(([label, value]) => (
          <article key={label} className="admin-card">
            <p className="muted">{label}</p>
            <p className="font-display" style={{ fontSize: '1.6rem' }}>{value}</p>
          </article>
        ))}
      </div>
      <div className="admin-split">
        <article className="admin-card">
          <h2 className="font-display">Carritos</h2>
          <p>Activos {db.carts.filter((c) => c.status === 'activo').length} · Inactivos {db.carts.filter((c) => c.status === 'inactivo').length} · Abandonados {db.carts.filter((c) => c.status === 'abandonado').length}</p>
        </article>
        <article className="admin-card">
          <h2 className="font-display">Catálogo</h2>
          <ul>{top.map((p) => <li key={String(p.id)}>{String(p.name)} · stock {String(p.stock)}</li>)}</ul>
        </article>
      </div>
      <article className="admin-card">
        <h2 className="font-display">Alertas</h2>
        {alerts.length ? <ul>{alerts.map((a) => <li key={a}>{a}</li>)}</ul> : <p className="muted">Sin alertas.</p>}
      </article>
    </div>
  )
}
