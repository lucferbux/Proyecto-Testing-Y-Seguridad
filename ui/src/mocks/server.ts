import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Creamos el server con todos los handlers
export const server = setupServer(...handlers);

// Export para usar en tests específicos
export { http, HttpResponse } from 'msw';