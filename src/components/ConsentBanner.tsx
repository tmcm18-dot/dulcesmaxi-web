import { Cookie } from 'lucide-react'
import { useState } from 'react'
import { loadConsent, saveConsent } from '../lib/storage'

export function ConsentBanner() {
  const [visible, setVisible] = useState(() => loadConsent() === null)

  if (!visible) return null

  const choose = (analytics: boolean) => {
    saveConsent(analytics)
    setVisible(false)
  }

  return (
    <aside className="consent" role="dialog" aria-labelledby="consent-title">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span className="benefit-icon" aria-hidden="true">
          <Cookie size={20} />
        </span>
        <div>
          <p id="consent-title" style={{ fontWeight: 800 }}>
            Tu privacidad importa
          </p>
          <p style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
            Usamos almacenamiento necesario para el carrito. La analítica anónima es opcional y nos ayuda a mejorar la tienda.
          </p>
        </div>
      </div>
      <div className="consent-actions">
        <button type="button" className="btn btn-primary" onClick={() => choose(true)}>
          Aceptar analítica
        </button>
        <button type="button" className="btn btn-outline" onClick={() => choose(false)}>
          Solo necesarias
        </button>
      </div>
    </aside>
  )
}
