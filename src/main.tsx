import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global error handlers for Production Diagnostic
window.addEventListener('error', (event) => {
  console.error('[PRODUCTION GLOBAL ERROR TRAP]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[PRODUCTION UNHANDLED PROMISE REJECTION]:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

