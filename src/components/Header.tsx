import { CakeSlice, Search, ShoppingBag } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'

export function Header() {
  const { site } = useSite()
  const { count } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/?q=${encodeURIComponent(value)}#productos` : '/#productos')
  }

  return (
    <>
      <div className="topbar">{site.brand.topBar}</div>
      <header className="site-header">
        <div className="container-wide header-row">
          <Link to="/" className="logo" aria-label={`${site.brand.name}, ir al inicio`}>
            <div className="logo-name">{site.brand.name}</div>
            <div className="logo-tag">{site.brand.tagline}</div>
          </Link>
          <form className="search" onSubmit={onSearch} role="search">
            <label htmlFor="site-search" className="sr-only">
              Buscar productos
            </label>
            <input
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar sabor o producto…"
            />
            <Search className="search-icon" aria-hidden="true" />
          </form>
          <nav className="nav-main" aria-label="Navegación principal">
            <Link to="/?categoria=mermelada#productos" className="nav-link">
              Mermeladas
            </Link>
            <Link to="/pasteleria" className="nav-link">
              <CakeSlice size={16} /> Pastelería
            </Link>
            <Link to="/cart" className="icon-link" aria-label={`Carrito con ${count} productos`}>
              <ShoppingBag size={20} />
              <span className="nav-text">Carrito</span>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          </nav>
        </div>
        <form className="mobile-search" onSubmit={onSearch} role="search">
          <label htmlFor="mobile-search" className="sr-only">
            Buscar productos
          </label>
          <input
            id="mobile-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar productos…"
          />
          <Search className="search-icon" style={{ left: 28, top: 12, width: 16, height: 16 }} aria-hidden="true" />
        </form>
        <nav className="quick-nav" aria-label="Accesos rápidos">
          <Link to="/?categoria=mermelada#productos" className="chip">
            Mermeladas
          </Link>
          <Link to="/pasteleria" className="chip chip-solid">
            <CakeSlice size={14} /> Pastelería por encargo
          </Link>
        </nav>
      </header>
    </>
  )
}
