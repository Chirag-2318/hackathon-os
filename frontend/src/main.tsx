import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './shared/motion/tokens.css';
import { initStorageVersion } from './lib/storage-version';
import { initSentry } from './lib/sentry';
import App from './App.tsx';

initStorageVersion();
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
