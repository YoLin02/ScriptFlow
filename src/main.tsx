import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress benign ResizeObserver loop limit warnings/errors
if (typeof window !== 'undefined') {
  const resizeObserverErr = 'ResizeObserver loop completed with undelivered notifications.';
  const resizeObserverLimitErr = 'ResizeObserver loop limit exceeded';
  
  const errorHandler = (e: ErrorEvent) => {
    if (e.message === resizeObserverErr || e.message === resizeObserverLimitErr) {
      e.stopImmediatePropagation();
    }
  };

  const rejectionHandler = (e: PromiseRejectionEvent) => {
    if (e.reason && (e.reason.message === resizeObserverErr || e.reason.message === resizeObserverLimitErr)) {
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
