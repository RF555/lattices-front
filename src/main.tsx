import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './i18n/i18n';
import { App } from './app/App';
import './styles/globals.css';

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

void enableMocking().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
