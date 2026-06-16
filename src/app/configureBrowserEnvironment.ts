import { APP_NAME } from '../appMetadata';

export function configureBrowserEnvironment() {
  document.title = APP_NAME;

  if (typeof window === 'undefined') return;

  const resizeObserverErr = 'ResizeObserver loop completed with undelivered notifications.';
  const resizeObserverLimitErr = 'ResizeObserver loop limit exceeded';

  const errorHandler = (event: ErrorEvent) => {
    if (event.message === resizeObserverErr || event.message === resizeObserverLimitErr) {
      event.stopImmediatePropagation();
    }
  };

  const rejectionHandler = (event: PromiseRejectionEvent) => {
    if (
      event.reason &&
      (event.reason.message === resizeObserverErr || event.reason.message === resizeObserverLimitErr)
    ) {
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
}
