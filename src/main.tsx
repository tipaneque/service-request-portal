import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { startMockWorker } from './mocks/startWorker'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root was not found in index.html')
}

// The mock worker must be listening before the first request is issued,
// otherwise the initial list call escapes to the network.
void startMockWorker().then(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
