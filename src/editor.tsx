import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SiteProvider } from './context/SiteContext'
import { AdminPage } from './pages/AdminPage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteProvider>
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    </SiteProvider>
  </StrictMode>,
)
