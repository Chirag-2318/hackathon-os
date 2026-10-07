// MSW browser integration — starts the service worker in development
// See: https://mswjs.io/docs/integrations/browser
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
