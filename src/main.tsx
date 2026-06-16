import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, { AppProviders, configureBrowserEnvironment } from './app';
import './index.css';

configureBrowserEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
