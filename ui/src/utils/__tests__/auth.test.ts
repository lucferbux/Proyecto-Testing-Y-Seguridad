import {
  setAuthToken,
  removeAuthToken,
  isTokenActive,
  getAccessToken,
  getCurrentUser,
  logout,
  WrongCredentialsException
} from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode
const mockJwtDecode = jest.fn();
jest.mock('jwt-decode', () => ({
  __esModule: true,
  default: (token: string) => mockJwtDecode(token)
}));

describe('auth.ts - Utilidades de autenticación', () => {
  // Mock de localStorage
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Crear un objeto para simular localStorage
    localStorageMock = {};

    // Mockear métodos de localStorage
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });

    // Reset jwt-decode mock
    mockJwtDecode.mockReset();
    mockJwtDecode.mockReturnValue({
      _id: '123456',
      email: 'test@example.com',
      iat: 1609459200, // 2021-01-01 00:00:00 UTC (segundos)
      exp: 1609545600 // 2021-01-02 00:00:00 UTC (segundos)
    });
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  // ============================================
  // setAuthToken Tests
  // ============================================
  describe('setAuthToken', () => {
    it('debe guardar el token en localStorage', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

      setAuthToken(mockToken);

      // Verificar que setItem fue llamado
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(tokenKey, expect.any(String));
    });

    it('debe convertir timestamps de segundos a milisegundos', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      // JWT usa timestamps en segundos, debemos convertir a milisegundos
      expect(parsedToken.notBeforeTimestampInMillis).toBeGreaterThan(1000000000000);
      expect(parsedToken.expirationTimestampInMillis).toBeGreaterThan(1000000000000);
    });

    it('debe almacenar el accessToken correctamente', () => {
      const mockToken = 'my-access-token-123';

      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      expect(parsedToken.accessToken).toBe(mockToken);
    });

    it('debe calcular correctamente notBeforeTimestampInMillis desde iat', () => {
      const mockToken = 'test-token';
      const iat = 1609459200; // seconds
      mockJwtDecode.mockReturnValue({
        _id: '123',
        email: 'test@test.com',
        iat: iat,
        exp: iat + 3600
      });

      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      expect(parsedToken.notBeforeTimestampInMillis).toBe(iat * 1000);
    });

    it('debe calcular correctamente expirationTimestampInMillis desde exp', () => {
      const mockToken = 'test-token';
      const exp = 1609545600; // seconds
      mockJwtDecode.mockReturnValue({
        _id: '123',
        email: 'test@test.com',
        iat: 1609459200,
        exp: exp
      });

      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      expect(parsedToken.expirationTimestampInMillis).toBe(exp * 1000);
    });
  });

  // ============================================
  // removeAuthToken Tests
  // ============================================
  describe('removeAuthToken', () => {
    it('debe eliminar el token de localStorage', () => {
      // Primero guardamos un token
      localStorage.setItem(
        tokenKey,
        JSON.stringify({
          accessToken: 'test-token',
          notBeforeTimestampInMillis: Date.now(),
          expirationTimestampInMillis: Date.now() + 3600000
        })
      );

      expect(localStorage.getItem(tokenKey)).toBeTruthy();

      // Removemos el token
      removeAuthToken();

      expect(localStorage.getItem(tokenKey)).toBeNull();
    });

    it('debe funcionar sin lanzar error aunque no haya token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();

      // No debe lanzar error
      expect(() => removeAuthToken()).not.toThrow();
    });

    it('debe llamar a localStorage.removeItem con la clave correcta', () => {
      removeAuthToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
    });
  });

  // ============================================
  // isTokenActive Tests
  // ============================================
  describe('isTokenActive', () => {
    const FIXED_TIME = 1609459200000; // 2021-01-01 00:00:00 UTC (milisegundos)

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('debe retornar false cuando no hay token', () => {
      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar true cuando el token es válido', () => {
      const validToken = {
        accessToken: 'valid-token',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000, // Activo desde hace 1 hora
        expirationTimestampInMillis: FIXED_TIME + 3600000 // Expira en 1 hora
      };

      localStorageMock[tokenKey] = JSON.stringify(validToken);

      expect(isTokenActive()).toBe(true);
    });

    it('debe retornar false cuando el token ha expirado', () => {
      const expiredToken = {
        accessToken: 'expired-token',
        notBeforeTimestampInMillis: FIXED_TIME - 7200000, // Activo desde hace 2 horas
        expirationTimestampInMillis: FIXED_TIME - 3600000 // Expiró hace 1 hora
      };

      localStorageMock[tokenKey] = JSON.stringify(expiredToken);

      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar false cuando el token aún no está activo', () => {
      const futureToken = {
        accessToken: 'future-token',
        notBeforeTimestampInMillis: FIXED_TIME + 3600000, // Se activa en 1 hora
        expirationTimestampInMillis: FIXED_TIME + 7200000 // Expira en 2 horas
      };

      localStorageMock[tokenKey] = JSON.stringify(futureToken);

      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar true cuando el token está en el límite de expiración', () => {
      const aboutToExpireToken = {
        accessToken: 'about-to-expire',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME + 1 // Expira en 1ms
      };

      localStorageMock[tokenKey] = JSON.stringify(aboutToExpireToken);

      expect(isTokenActive()).toBe(true);
    });

    it('debe retornar true cuando el token acaba de activarse', () => {
      const justActivatedToken = {
        accessToken: 'just-activated',
        notBeforeTimestampInMillis: FIXED_TIME, // Activado justo ahora
        expirationTimestampInMillis: FIXED_TIME + 3600000
      };

      localStorageMock[tokenKey] = JSON.stringify(justActivatedToken);

      expect(isTokenActive()).toBe(true);
    });

    it('debe retornar false cuando expirationTimestamp es exactamente igual al tiempo actual', () => {
      const exactExpirationToken = {
        accessToken: 'exact-expiration',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME // Expira exactamente ahora
      };

      localStorageMock[tokenKey] = JSON.stringify(exactExpirationToken);

      expect(isTokenActive()).toBe(false);
    });
  });

  // ============================================
  // getAccessToken Tests
  // ============================================
  describe('getAccessToken', () => {
    it('debe retornar el accessToken cuando existe un token válido', () => {
      const expectedToken = 'my-access-token-abc123';
      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: expectedToken,
        notBeforeTimestampInMillis: Date.now() - 3600000,
        expirationTimestampInMillis: Date.now() + 3600000
      });

      const result = getAccessToken();

      expect(result).toBe(expectedToken);
    });

    it('debe retornar string vacío cuando no hay token en localStorage', () => {
      // localStorage vacío
      const result = getAccessToken();

      expect(result).toBe('');
    });

    it('debe retornar el token correcto después de setAuthToken', () => {
      const testToken = 'set-then-get-token';
      setAuthToken(testToken);

      const result = getAccessToken();

      expect(result).toBe(testToken);
    });

    it('debe retornar string vacío después de removeAuthToken', () => {
      // Primero guardamos un token
      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token-to-remove',
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000
      });

      removeAuthToken();

      const result = getAccessToken();

      expect(result).toBe('');
    });
  });

  // ============================================
  // getCurrentUser Tests
  // ============================================
  describe('getCurrentUser', () => {
    const FIXED_TIME = 1609459200000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('debe retornar undefined cuando no hay token', () => {
      const result = getCurrentUser();

      expect(result).toBeUndefined();
    });

    it('debe retornar usuario con datos correctos cuando token es válido', () => {
      const mockPayload = {
        _id: 'user-123',
        email: 'user@example.com',
        iat: FIXED_TIME / 1000 - 3600,
        exp: FIXED_TIME / 1000 + 3600
      };
      mockJwtDecode.mockReturnValue(mockPayload);

      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'valid-token',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME + 3600000
      });

      const result = getCurrentUser();

      expect(result).toEqual({
        _id: 'user-123',
        active: true,
        email: 'user@example.com'
      });
    });

    it('debe retornar undefined y hacer logout cuando token está expirado', () => {
      const expiredToken = {
        accessToken: 'expired-token',
        notBeforeTimestampInMillis: FIXED_TIME - 7200000,
        expirationTimestampInMillis: FIXED_TIME - 3600000 // Ya expiró
      };

      localStorageMock[tokenKey] = JSON.stringify(expiredToken);

      const result = getCurrentUser();

      expect(result).toBeUndefined();
      // Verificar que se llamó a removeAuthToken (logout)
      expect(localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
    });

    it('debe parsear correctamente el _id del payload del JWT', () => {
      const mockPayload = {
        _id: 'specific-user-id-456',
        email: 'test@test.com',
        iat: FIXED_TIME / 1000 - 3600,
        exp: FIXED_TIME / 1000 + 3600
      };
      mockJwtDecode.mockReturnValue(mockPayload);

      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME + 3600000
      });

      const result = getCurrentUser();

      expect(result?._id).toBe('specific-user-id-456');
    });

    it('debe parsear correctamente el email del payload del JWT', () => {
      const mockPayload = {
        _id: '123',
        email: 'specific@email.com',
        iat: FIXED_TIME / 1000 - 3600,
        exp: FIXED_TIME / 1000 + 3600
      };
      mockJwtDecode.mockReturnValue(mockPayload);

      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME + 3600000
      });

      const result = getCurrentUser();

      expect(result?.email).toBe('specific@email.com');
    });

    it('debe siempre retornar active como true para usuarios válidos', () => {
      mockJwtDecode.mockReturnValue({
        _id: '123',
        email: 'test@test.com',
        iat: FIXED_TIME / 1000 - 3600,
        exp: FIXED_TIME / 1000 + 3600
      });

      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token',
        notBeforeTimestampInMillis: FIXED_TIME - 3600000,
        expirationTimestampInMillis: FIXED_TIME + 3600000
      });

      const result = getCurrentUser();

      expect(result?.active).toBe(true);
    });
  });

  // ============================================
  // logout Tests
  // ============================================
  describe('logout', () => {
    it('debe eliminar el token de localStorage', () => {
      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token-to-logout',
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000
      });

      logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
    });

    it('debe funcionar sin errores cuando no hay token', () => {
      expect(() => logout()).not.toThrow();
    });
  });

  // ============================================
  // WrongCredentialsException Tests
  // ============================================
  describe('WrongCredentialsException', () => {
    it('debe ser una instancia de Error', () => {
      const exception = new WrongCredentialsException();

      expect(exception).toBeInstanceOf(Error);
    });

    it('debe poder ser lanzado y capturado', () => {
      expect(() => {
        throw new WrongCredentialsException();
      }).toThrow(WrongCredentialsException);
    });

    it('debe tener el nombre correcto de la clase', () => {
      const exception = new WrongCredentialsException();

      expect(exception.name).toBe('Error');
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('debe manejar localStorage vacío correctamente', () => {
      // Asegurar que localStorage está vacío
      localStorageMock = {};

      expect(isTokenActive()).toBe(false);
      expect(getAccessToken()).toBe('');
      expect(getCurrentUser()).toBeUndefined();
    });

    it('debe manejar token con estructura válida pero valores extremos', () => {
      const FIXED_TIME = 1609459200000;
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

      const extremeToken = {
        accessToken: '',
        notBeforeTimestampInMillis: 0,
        expirationTimestampInMillis: Number.MAX_SAFE_INTEGER
      };

      localStorageMock[tokenKey] = JSON.stringify(extremeToken);

      expect(isTokenActive()).toBe(true);
      expect(getAccessToken()).toBe('');

      jest.restoreAllMocks();
    });

    it('debe funcionar con tokens que tienen accessToken muy largo', () => {
      const longToken = 'a'.repeat(10000);
      mockJwtDecode.mockReturnValue({
        _id: '123',
        email: 'test@test.com',
        iat: 1609459200,
        exp: 1609545600
      });

      setAuthToken(longToken);

      expect(getAccessToken()).toBe(longToken);
    });

    it('debe manejar múltiples llamadas consecutivas a setAuthToken', () => {
      const tokens = ['token1', 'token2', 'token3'];

      tokens.forEach((token) => {
        setAuthToken(token);
      });

      expect(getAccessToken()).toBe('token3');
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('debe manejar múltiples llamadas consecutivas a removeAuthToken', () => {
      localStorageMock[tokenKey] = JSON.stringify({
        accessToken: 'token',
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000
      });

      removeAuthToken();
      removeAuthToken();
      removeAuthToken();

      expect(localStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(getAccessToken()).toBe('');
    });
  });
});
