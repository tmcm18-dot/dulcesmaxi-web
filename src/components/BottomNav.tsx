import { CakeSlice, Home, ShoppingBag } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export function BottomNav() {
  const { pathname } = useLocation()
  const { count } = useCart()
  const items = [
    { to: '/', icon: Home, label: 'Inicio', exact: true },
    { to: '/pasteleria', icon: CakeSlice, label: 'Pastelería' },
    { to: '/cart', icon: ShoppingBag, label: 'Carrito', badge: count },
  ]

  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {items.map((item) => {
        const active = item.exact ? pathname === '/' : pathname.startsWith(item.to)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className="bottom-item"
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{item.label}</span>
            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}
