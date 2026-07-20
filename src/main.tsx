import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { requireRoot } from './lib/requireRoot'
import './index.css'

createRoot(requireRoot()).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
