// Mock del módulo config para evitar problemas con import.meta
jest.mock('../config');

import { API_BASE_URI } from '../config';

describe('Config Module', () => {
  it('exports API_BASE_URI', () => {
    expect(API_BASE_URI).toBeDefined();
  });

  it('API_BASE_URI contains localhost URL', () => {
    expect(API_BASE_URI).toBe('http://localhost:3000/api');
  });
});