import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './shared/motion/tokens.css';
import { initStorageVersion } from './lib/storage-version';
import App from './App.tsx';

initStorageVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
