import { useMemo, useRef, useState } from 'react'
import type { AdminDb } from '../api'
import { adminOp } from '../api'

export default function CreativePage({ db, reload }: { db: AdminDb; reload: () => Promise<void> }) {
  const [productId, setProductId] = useState(String(db.products[0]?.id || ''))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cta, setCta] = useState('Pedir por WhatsApp')
  const [format, setFormat] = useState<'post' | 'story'>('post')
  const [note, setNote] = useState('La generación de copy y fondos usa plantillas locales (no hay API de IA configurada).')
  const [bg, setBg] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const product = db.products.find((p) => p.id === productId)

  const size = format === 'story' ? [1080, 1920] : [1080, 1080]

  const preview = useMemo(() => {
    return {
      title: title || String(product?.name || 'Dulces Maxi'),
      body: body || String(product?.shortDescription || ''),
    }
  }, [title, body, product])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const [w, h] = size
    canvas.width = w
    canvas.height = h
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#C51D5D')
    g.addColorStop(1, '#FFC83D')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 72px Fredoka, sans-serif'
    ctx.fillText(preview.title.slice(0, 42), 80, 280)
    ctx.font = '36px Nunito Sans, sans-serif'
    ctx.fillText(preview.body.slice(0, 80), 80, 380)
    ctx.fillText(cta, 80, h - 160)
  }

  return (
    <div className="stack">
      <div className="admin-card stack">
        <h1 className="font-display">Estudio creativo</h1>
        <p className="muted">{note} No hay publicación automática en redes.</p>
        <label className="field">Producto
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {db.products.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>)}
          </select>
        </label>
        <label className="field">Formato
          <select value={format} onChange={(e) => setFormat(e.target.value as 'post' | 'story')}>
            <option value="post">Post 1:1</option>
            <option value="story">Story 9:16</option>
          </select>
        </label>
        <label className="field">Título<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field">Texto<textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <label className="field">CTA<input value={cta} onChange={(e) => setCta(e.target.value)} /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={() => void adminOp<{ copies: string[]; note: string }>('generate_copy', { productId }).then((r) => { setBody(r.copies[0]); setNote(r.note) })}>Texto (plantilla)</button>
          <button type="button" className="btn btn-outline" onClick={() => void adminOp<{ background: string; note: string }>('generate_background', { category: product?.category }).then((r) => { setBg(r.background); setNote(r.note) })}>Fondo (plantilla)</button>
          <button type="button" className="btn btn-primary" onClick={() => { draw(); void adminOp('save_design', { productId, title: preview.title, body: preview.body, cta, format, background: bg }).then(reload) }}>Guardar borrador</button>
          <button type="button" className="btn btn-outline" onClick={() => { draw(); const a = document.createElement('a'); a.href = canvasRef.current?.toDataURL('image/png') || ''; a.download = 'pieza-dulces-maxi.png'; a.click() }}>PNG</button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 420, borderRadius: 16, background: '#C51D5D' }} />
      {bg ? <img src={bg} alt="" style={{ maxWidth: 220 }} /> : null}
      <div className="admin-card">
        <h2>Borradores</h2>
        <ul>{db.designs.map((d) => <li key={String(d.id)}>{String(d.title)} · {String(d.format)}</li>)}</ul>
        <button type="button" className="btn btn-outline" onClick={() => void adminOp('bulk_designs', { productIds: db.products.slice(0, 4).map((p) => p.id) }).then(reload)}>Borradores para el catálogo</button>
      </div>
    </div>
  )
}
