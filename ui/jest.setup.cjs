require('@testing-library/jest-dom');
require('whatwg-fetch');

// ==================== POLYFILLS PARA MSW v2 ====================
// MSW v2 requiere fetch API nativa
// TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// ReadableStream y otras APIs de streams
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// BroadcastChannel polyfill para MSW
class BroadcastChannelPolyfill {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}
global.BroadcastChannel = global.BroadcastChannel || BroadcastChannelPolyfill;

// ==================== CONFIGURACIÓN DE MSW ====================
// NOTA: MSW v2 requiere ESM nativo y Node.js 18+
// Para habilitarlo completamente, necesitas ejecutar Jest con:
//   NODE_OPTIONS='--experimental-vm-modules' npx jest
// 
// Por ahora, MSW está configurado pero puede no cargarse correctamente
// en todos los entornos. Los tests que dependen de MSW deben usar
// la configuración específica en cada archivo de test.
//
// Archivos de MSW disponibles en:
// - src/mocks/handlers.cjs - Handlers para interceptar requests
// - src/mocks/server.cjs - Server de MSW para tests

// ==================== CONFIGURACIÓN GLOBAL ====================

// Configuración global para todos los tests
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores en tests
  warn: jest.fn(),  // Silenciar warnings en tests
};

// Mock de window.matchMedia (usado por algunos componentes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de import.meta.env (variables de entorno de Vite)
// Definir import.meta globalmente
if (typeof global.import === 'undefined') {
  global.import = {};
}
global.import.meta = {
  env: {
    VITE_API_URI: 'http://localhost:3000/api',
    VITE_BASE_URI: 'http://localhost:5173',
  },
};

