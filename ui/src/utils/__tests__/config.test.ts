// src/utils/__tests__/config.test.ts

// Usamos el mock definido en src/utils/__mocks__/config.ts
jest.mock('../config');

import { API_BASE_URI } from '../config';

describe('Config Module', () => {
  it('exporta API_BASE_URI', () => {
    expect(API_BASE_URI).toBeDefined();
  });

  it('API_BASE_URI es la URL de la API local mockeada', () => {
    expect(API_BASE_URI).toBe('http://localhost:3000/api');
  });

  it('API_BASE_URI es una cadena de texto', () => {
    expect(typeof API_BASE_URI).toBe('string');
  });

  it('API_BASE_URI comienza con http', () => {
    expect(API_BASE_URI.startsWith('http')).toBe(true);
  });
});
