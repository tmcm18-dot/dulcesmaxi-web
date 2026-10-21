import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ConsentBanner } from './ConsentBanner'
import { Footer } from './Footer'
import { Header } from './Header'
import { WhatsAppFloat } from './WhatsAppFloat'

export function Layout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <BottomNav />
      <ConsentBanner />
      <div className="bottom-spacer" aria-hidden="true" />
    </div>
  )
}
