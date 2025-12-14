// src/utils/__tests__/auth.test.ts

import * as auth from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode para controlar iat/exp
jest.mock('jwt-decode', () => {
  return jest.fn(() => ({
    _id: '123456',
    email: 'test@example.com',
    iat: 1609459200, // 2021-01-01 00:00:00 UTC
    exp: 1609545600, // 2021-01-02 00:00:00 UTC
  }));
});

describe('auth.ts - Utilidades de autenticación', () => {
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    // Mock simple de localStorage
    localStorageStore = {};

    const localStorageMock = {
      getItem: jest.fn((key: string) => localStorageStore[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: jest.fn(() => {
        localStorageStore = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('setAuthToken', () => {
    it('guarda el token en localStorage con la estructura correcta', () => {
      auth.setAuthToken('fake-jwt-token');

      expect(window.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        tokenKey,
        expect.any(String),
      );

      const saved = (window.localStorage.setItem as jest.Mock).mock
        .calls[0][1] as string;

      const parsed = JSON.parse(saved);

      expect(parsed).toMatchObject({
        accessToken: 'fake-jwt-token',
        notBeforeTimestampInMillis: 1609459200 * 1000,
        expirationTimestampInMillis: 1609545600 * 1000,
      });
    });
  });

  describe('removeAuthToken', () => {
    it('elimina el token de localStorage si existe', () => {
      auth.setAuthToken('fake-jwt-token');

      expect(window.localStorage.getItem(tokenKey)).not.toBeNull();

      auth.removeAuthToken();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
      expect(window.localStorage.getItem(tokenKey)).toBeNull();
    });

    it('no lanza error si no hay token guardado', () => {
      expect(window.localStorage.getItem(tokenKey)).toBeNull();
      expect(() => auth.removeAuthToken()).not.toThrow();
    });
  });

  describe('getAccessToken', () => {
    it('devuelve cadena vacía si no hay token almacenado', () => {
      const value = auth.getAccessToken();
      expect(value).toBe('');
    });

    it('devuelve el accessToken cuando el token está guardado', () => {
      auth.setAuthToken('fake-jwt-token');

      const value = auth.getAccessToken();
      expect(value).toBe('fake-jwt-token');
    });
  });

  describe('isTokenActive', () => {
    it('devuelve false cuando no hay token', () => {
      const result = auth.isTokenActive();
      expect(result).toBe(false);
    });

    it('devuelve true cuando el token está dentro del rango de validez', () => {
      auth.setAuthToken('fake-jwt-token');

      const middleTime =
        1609459200 * 1000 + (1609545600 * 1000 - 1609459200 * 1000) / 2;

      jest.spyOn(Date, 'now').mockReturnValue(middleTime);

      const result = auth.isTokenActive();
      expect(result).toBe(true);
    });

    it('devuelve false cuando el token está expirado', () => {
      auth.setAuthToken('fake-jwt-token');

      const afterExpiration = 1609545600 * 1000 + 1;
      jest.spyOn(Date, 'now').mockReturnValue(afterExpiration);

      const result = auth.isTokenActive();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('devuelve undefined si no hay token almacenado', () => {
      const user = auth.getCurrentUser();
      expect(user).toBeUndefined();
    });

    it('devuelve el usuario cuando el token está activo', () => {
      auth.setAuthToken('fake-jwt-token');

      const middleTime =
        1609459200 * 1000 + (1609545600 * 1000 - 1609459200 * 1000) / 2;
      jest.spyOn(Date, 'now').mockReturnValue(middleTime);

      const user = auth.getCurrentUser();

      expect(user).toEqual({
        _id: '123456',
        active: true,
        email: 'test@example.com',
      });
    });

    it('devuelve undefined y llama a logout cuando el token está expirado', () => {
      auth.setAuthToken('fake-jwt-token');

      const afterExpiration = 1609545600 * 1000 + 1;
      jest.spyOn(Date, 'now').mockReturnValue(afterExpiration);

      const removeSpy = jest.spyOn(auth, 'removeAuthToken');

      const user = auth.getCurrentUser();
      expect(user).toBeUndefined();
      expect(window.localStorage.removeItem).toHaveBeenCalledTimes(1);
    });
  });
});


