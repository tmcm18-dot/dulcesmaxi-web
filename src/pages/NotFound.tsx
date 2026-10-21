import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export function NotFound() {
  return (
    <div className="empty">
      <Seo title="Página no encontrada · Dulces Maxi" />
      <p className="font-display" style={{ fontSize: '4rem' }}>404</p>
      <h1 className="font-display" style={{ fontSize: '2rem' }}>No encontramos esa página</h1>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 24 }}>Volver al inicio</Link>
    </div>
  )
}
