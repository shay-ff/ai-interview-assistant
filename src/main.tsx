import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearPersistedState } from './utils/clearStorage'

// Make clear function available globally for debugging
if (import.meta.env.MODE === 'development') {
  (window as any).clearPersistedState = clearPersistedState;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)