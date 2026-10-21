import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CartProvider } from './context/CartContext'
import { SiteProvider } from './context/SiteContext'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { Home } from './pages/Home'
import { LegalPage } from './pages/LegalPage'
import { NotFound } from './pages/NotFound'
import { PasteleriaPage } from './pages/PasteleriaPage'
import { ProductPage } from './pages/ProductPage'

export default function App() {
  return (
    <SiteProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pasteleria" element={<PasteleriaPage />} />
              <Route path="/privacidad" element={<LegalPage type="privacidad" />} />
              <Route path="/terminos" element={<LegalPage type="terminos" />} />
              <Route path="/entregas" element={<LegalPage type="entregas" />} />
              <Route path="/consumo-responsable" element={<LegalPage type="alcohol" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SiteProvider>
  )
}
