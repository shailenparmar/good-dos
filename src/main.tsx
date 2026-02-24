import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({
        onNeedRefresh() {
          // Auto-update after 60s
          setTimeout(() => window.location.reload(), 60000)
        },
      })
    } catch {
      // PWA not available in dev
    }
  })
}
