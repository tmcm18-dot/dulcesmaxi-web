import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

type Row = { id: string; sku: string; name: string; cost: number; priceBefore: number; priceAfter: number; margin: number }

export default function PricesPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [mode, setMode] = useState<'markup' | 'margin'>('markup')
  const [percent, setPercent] = useState('40')
  const [ending, setEnding] = useState('90')
  const [scope, setScope] = useState('all')
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const run = async (preview: boolean) => {
    setErr('')
    try {
      const res = await adminOp<{ results: Row[] }>('apply_prices', {
        mode,
        percent,
        ending,
        scope,
        category: scope === 'all' ? undefined : scope,
        preview,
      })
      setRows(res.results || [])
      setMsg(preview ? 'Vista previa: no se guardó nada.' : 'Precios aplicados.')
      if (!preview) await reload()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="stack">
      <div className="admin-card stack">
        <h1 className="font-display">Costos y márgenes</h1>
        <p className="muted">No se permite un precio menor al costo efectivo.</p>
        {msg ? <p style={{ color: '#237347' }}>{msg}</p> : null}
        {err ? <p style={{ color: '#B42318' }}>{err}</p> : null}
        <div className="admin-grid-2">
          <label className="field">
            Regla
            <select value={mode} onChange={(e) => setMode(e.target.value as 'markup' | 'margin')}>
              <option value="markup">Recargo sobre costo</option>
              <option value="margin">Margen real objetivo</option>
            </select>
          </label>
          <label className="field">Porcentaje<input type="number" value={percent} onChange={(e) => setPercent(e.target.value)} /></label>
          <label className="field">
            Terminación
            <select value={ending} onChange={(e) => setEnding(e.target.value)}>
              <option value="none">Sin redondeo</option>
              <option value="90">…90</option>
              <option value="490">…490</option>
              <option value="990">…990</option>
            </select>
          </label>
          <label className="field">
            Alcance
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">Todo el catálogo</option>
              <option value="mermelada">Mermeladas</option>
              <option value="dulce_regional">Dulces regionales</option>
              <option value="combo">Combos</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={() => void run(true)}>Vista previa</button>
          <button type="button" className="btn btn-primary" onClick={() => void run(false)} disabled={!rows.length}>Aplicar</button>
        </div>
      </div>
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>SKU</th><th>Producto</th><th>Costo</th><th>Antes</th><th>Después</th><th>Margen</th></tr>
          </thead>
          <tbody>
            {(rows.length ? rows : db.products.map((p) => ({
              id: String(p.id),
              sku: String(p.sku),
              name: String(p.name),
              cost: Number(p.cost || 0),
              priceBefore: Number(p.price),
              priceAfter: Number(p.price),
              margin: Number(p.price) ? ((Number(p.price) - Number(p.cost || 0)) / Number(p.price)) * 100 : 0,
            }))).map((row) => (
              <tr key={row.id}>
                <td>{row.sku}</td>
                <td>{row.name}</td>
                <td>{formatPrice(row.cost)}</td>
                <td>{formatPrice(row.priceBefore)}</td>
                <td>{formatPrice(row.priceAfter)}</td>
                <td>{row.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
