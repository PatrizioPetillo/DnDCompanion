import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// La schermata di apertura (index.html) sfuma quando l'app ha disegnato la prima schermata (23/11)
requestAnimationFrame(() => requestAnimationFrame(() => {
  const a = document.getElementById('apertura')
  if (!a) return
  a.classList.add('via')
  setTimeout(() => a.remove(), 400)
}))
