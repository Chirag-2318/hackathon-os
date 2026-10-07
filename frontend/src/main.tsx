import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './shared/motion/tokens.css'
import App from './App.tsx'

async function enableMocking() {
  // Set VITE_MSW_ENABLED=true in .env.development.local to enable mock API.
  // Leave unset (or false) when developing against the real Spring Boot backend.
  if (import.meta.env.DEV && import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
