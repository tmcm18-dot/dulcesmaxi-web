import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import { fileToCompressedDataUrl } from '../../lib/storage'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

const empty = {
  id: '',
  sku: '',
  name: '',
  shortDescription: '',
  description: '',
  price: 0,
  cost: 0,
  size: '500 g',
  stock: 0,
  lowStockThreshold: 5,
  expiresAt: '',
  category: 'mermelada',
  featured: false,
  imageUrl: '',
  ingredients: '',
  allergens: '',
  alcoholPercentage: 0,
  active: true,
}

export default function ProductsPage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [form, setForm] = useState<Record<string, unknown>>(empty)
  const [csv, setCsv] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setErr('')
    try {
      await adminOp('save_product', { product: form })
      setMsg('Producto guardado.')
      setForm(empty)
      await reload()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  const importCsv = async (confirm: boolean) => {
    setErr('')
    try {
      const res = await adminOp<{ errors?: { row: number; message: string }[]; count?: number }>('import_products', {
        csv,
        confirm,
      })
      if (!confirm) {
        setMsg(
          res.errors?.length
            ? `Vista previa: ${res.count} ok, ${res.errors.length} errores.`
            : `Vista previa: ${res.count} filas listas.`,
        )
        if (res.errors?.length) setErr(res.errors.map((e) => `L${e.row}: ${e.message}`).join(' · '))
        return
      }
      setMsg(`Importados ${res.count} productos.`)
      await reload()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="stack">
      <div className="admin-card">
        <h1 className="font-display">Productos</h1>
        <p className="muted">SKU único, precio ≥ costo, licores con graduación, pastelería sin stock de góndola.</p>
        {msg ? <p style={{ color: '#237347' }}>{msg}</p> : null}
        {err ? <p style={{ color: '#B42318' }}>{err}</p> : null}
      </div>
      <div className="admin-table-wrap admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th><th>Nombre</th><th>Precio</th><th>Costo</th><th>Stock</th><th>Vence</th><th></th>
            </tr>
          </thead>
          <tbody>
            {db.products.map((p) => (
              <tr key={String(p.id)}>
                <td>{String(p.sku)}</td>
                <td>{String(p.name)}</td>
                <td>{formatPrice(Number(p.price))}</td>
                <td>{formatPrice(Number(p.cost || 0))}</td>
                <td>{String(p.stock)}</td>
                <td>{String(p.expiresAt || '—')}</td>
                <td>
                  <button type="button" className="btn btn-outline" onClick={() => setForm(p)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="admin-card stack"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <h2 className="font-display">{form.id ? 'Editar' : 'Nuevo'} producto</h2>
        <div className="admin-grid-2">
          <label className="field">SKU<input value={String(form.sku)} onChange={(e) => set('sku', e.target.value)} required /></label>
          <label className="field">Nombre<input value={String(form.name)} onChange={(e) => set('name', e.target.value)} required /></label>
          <label className="field">Precio<input type="number" value={Number(form.price)} onChange={(e) => set('price', e.target.value)} /></label>
          <label className="field">Costo<input type="number" value={Number(form.cost)} onChange={(e) => set('cost', e.target.value)} /></label>
          <label className="field">Stock<input type="number" value={Number(form.stock)} onChange={(e) => set('stock', e.target.value)} /></label>
          <label className="field">Stock mínimo<input type="number" value={Number(form.lowStockThreshold)} onChange={(e) => set('lowStockThreshold', e.target.value)} /></label>
          <label className="field">Presentación<input value={String(form.size)} onChange={(e) => set('size', e.target.value)} /></label>
          <label className="field">Vencimiento<input type="date" value={String(form.expiresAt || '')} onChange={(e) => set('expiresAt', e.target.value)} /></label>
          <label className="field">
            Categoría
            <select value={String(form.category)} onChange={(e) => set('category', e.target.value)}>
              <option value="mermelada">Mermelada</option>
              <option value="dulce_regional">Dulce regional</option>
              <option value="pasteleria">Pastelería</option>
              <option value="combo">Combo</option>
              <option value="licor">Licor</option>
              <option value="edicion_especial">Edición especial</option>
            </select>
          </label>
          <label className="field">Alcohol %<input type="number" value={Number(form.alcoholPercentage)} onChange={(e) => set('alcoholPercentage', e.target.value)} /></label>
        </div>
        <label className="field">Descripción corta<input value={String(form.shortDescription)} onChange={(e) => set('shortDescription', e.target.value)} /></label>
        <label className="field">Descripción<textarea rows={3} value={String(form.description || '')} onChange={(e) => set('description', e.target.value)} /></label>
        <label className="field">Ingredientes<textarea rows={2} value={String(form.ingredients)} onChange={(e) => set('ingredients', e.target.value)} /></label>
        <label className="field">Alérgenos<input value={String(form.allergens || '')} onChange={(e) => set('allergens', e.target.value)} /></label>
        <label className="field">URL de foto<input value={String(form.imageUrl || '')} onChange={(e) => set('imageUrl', e.target.value)} /></label>
        <label className="field">
          Subir foto
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void fileToCompressedDataUrl(file).then((url) => set('imageUrl', url))
            }}
          />
        </label>
        <label className="check"><input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => set('featured', e.target.checked)} /> Destacado</label>
        <label className="check"><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => set('active', e.target.checked)} /> Activo en la tienda</label>
        <button type="submit" className="btn btn-primary">Guardar producto</button>
      </form>
      <div className="admin-card stack">
        <h2 className="font-display">Importar CSV</h2>
        <p className="muted">Columnas: sku,name,price,cost,stock,category,size,shortDescription,expiresAt</p>
        <textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={() => void importCsv(false)}>Revisar</button>
          <button type="button" className="btn btn-primary" onClick={() => void importCsv(true)}>Confirmar importación</button>
          <button type="button" className="btn btn-outline" onClick={() => void adminOp('undo_import').then(reload)}>Revertir última</button>
        </div>
      </div>
    </div>
  )
}
