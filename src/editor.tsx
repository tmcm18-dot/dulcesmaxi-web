import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AdminApp } from './admin/AdminApp'
import { panelBasename } from './admin/api'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={panelBasename()}>
      <AdminApp />
    </BrowserRouter>
  </StrictMode>,
)
