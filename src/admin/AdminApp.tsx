import { ArrowLeft, LogOut } from 'lucide-react'
import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import type { AdminDb } from './api'
import { adminOp } from './api'

const DashboardPage = lazy(() => import('./modules/DashboardPage'))
const ProductsPage = lazy(() => import('./modules/ProductsPage'))
const PricesPage = lazy(() => import('./modules/PricesPage'))
const InventoryPage = lazy(() => import('./modules/InventoryPage'))
const OrdersPage = lazy(() => import('./modules/OrdersPage'))
const CartsPage = lazy(() => import('./modules/CartsPage'))
const CustomersPage = lazy(() => import('./modules/CustomersPage'))
const PastryAdminPage = lazy(() => import('./modules/PastryAdminPage'))
const CreativePage = lazy(() => import('./modules/CreativePage'))
const SiteEditorPage = lazy(() => import('./modules/SiteEditorPage'))

const NAV = [
  ['', 'Dashboard'],
  ['productos', 'Productos'],
  ['precios', 'Precios'],
  ['inventario', 'Inventario'],
  ['pedidos', 'Pedidos'],
  ['carritos', 'Carritos'],
  ['clientes', 'Clientes'],
  ['pasteleria', 'Pastelería'],
  ['creativo', 'Creativo'],
  ['sitio', 'Sitio'],
] as const

async function logout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
  } finally {
    window.location.href = '/'
  }
}

export function AdminApp() {
  const [db, setDb] = useState<AdminDb | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const reload = useCallback(async () => {
    setError('')
    const res = await adminOp<{ ok: boolean; data: AdminDb }>('load_data')
    setDb(res.data)
  }, [])

  useEffect(() => {
    reload()
      .catch((err: Error) => {
        setError(err.message)
        if (err.message.includes('Sesión')) navigate('/')
      })
      .finally(() => setLoading(false))
  }, [navigate, reload])

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-top-inner">
          <Link to="/" className="icon-round" style={{ width: 44, height: 44, color: '#fff' }} aria-label="Ver tienda">
            <ArrowLeft />
          </Link>
          <div>
            <p className="font-display" style={{ fontSize: '1.2rem' }}>Dulces Maxi</p>
            <p style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-yellow)' }}>
              Panel de administración
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginLeft: 'auto', color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' }}
            onClick={() => void logout()}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>
      <div className="admin-layout">
      <nav className="admin-nav" aria-label="Módulos">
        {NAV.map(([to, label]) => (
          <NavLink key={to} to={to || '/'} end={to === ''} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="admin-main">
        {loading ? <p className="admin-card">Cargando panel…</p> : null}
        {error ? <p className="admin-card" style={{ color: '#B42318' }}>{error}</p> : null}
        {db ? (
          <Suspense fallback={<p className="admin-card">Cargando módulo…</p>}>
            <Routes>
              <Route path="/" element={<DashboardPage db={db} />} />
              <Route path="productos" element={<ProductsPage db={db} reload={reload} />} />
              <Route path="precios" element={<PricesPage db={db} reload={reload} />} />
              <Route path="inventario" element={<InventoryPage db={db} reload={reload} />} />
              <Route path="pedidos" element={<OrdersPage db={db} reload={reload} />} />
              <Route path="carritos" element={<CartsPage db={db} reload={reload} />} />
              <Route path="clientes" element={<CustomersPage db={db} reload={reload} />} />
              <Route path="pasteleria" element={<PastryAdminPage db={db} reload={reload} />} />
              <Route path="creativo" element={<CreativePage db={db} reload={reload} />} />
              <Route path="sitio" element={<SiteEditorPage db={db} reload={reload} />} />
            </Routes>
          </Suspense>
        ) : null}
      </main>
      </div>
    </div>
  )
}
