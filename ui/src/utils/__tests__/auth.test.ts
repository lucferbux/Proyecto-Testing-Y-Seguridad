import {
  setAuthToken,
  removeAuthToken,
  getCurrentUser,
  getAccessToken,
  isTokenActive,
} from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode
jest.mock('jwt-decode');
import jwt_decode from 'jwt-decode';
const mockJwtDecode = jwt_decode as jest.MockedFunction<typeof jwt_decode>;

describe('auth.ts - Utilidades de autenticación', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('setAuthToken', () => {
    it('debe almacenar el token en localStorage', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const mockPayload = {
        _id: 'user123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // Expira en 1 hora
      };

      mockJwtDecode.mockReturnValue(mockPayload);

      setAuthToken(mockToken);

      const storedToken = localStorage.getItem(tokenKey);
      expect(storedToken).toBeTruthy();

      const parsedToken = JSON.parse(storedToken!);
      expect(parsedToken.accessToken).toBe(mockToken);
      expect(parsedToken.notBeforeTimestampInMillis).toBe(mockPayload.iat * 1000);
      expect(parsedToken.expirationTimestampInMillis).toBe(mockPayload.exp * 1000);
    });

    it('debe llamar a jwt_decode para obtener el payload', () => {
      const mockToken = 'test-token';
      const mockPayload = {
        _id: 'user123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtDecode.mockReturnValue(mockPayload);

      setAuthToken(mockToken);

      expect(mockJwtDecode).toHaveBeenCalledWith(mockToken);
      expect(mockJwtDecode).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAuthToken', () => {
    it('debe eliminar el token de localStorage', () => {
      // Primero guardamos un token
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'test-token',
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000,
      }));

      expect(localStorage.getItem(tokenKey)).toBeTruthy();

      // Removemos el token
      removeAuthToken();

      expect(localStorage.getItem(tokenKey)).toBeNull();
    });

    it('debe funcionar aunque no haya token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();

      // No debe lanzar error
      expect(() => removeAuthToken()).not.toThrow();
    });
  });

  describe('isTokenActive', () => {
    it('debe retornar true para un token válido', () => {
      const now = Date.now();
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'valid-token',
        notBeforeTimestampInMillis: now - 1000, // Comenzó hace 1 segundo
        expirationTimestampInMillis: now + 3600000, // Expira en 1 hora
      }));

      expect(isTokenActive()).toBe(true);
    });

    it('debe retornar false si el token ha expirado', () => {
      const now = Date.now();
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'expired-token',
        notBeforeTimestampInMillis: now - 7200000, // Comenzó hace 2 horas
        expirationTimestampInMillis: now - 3600000, // Expiró hace 1 hora
      }));

      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar false si el token aún no es válido (notBefore futuro)', () => {
      const now = Date.now();
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'future-token',
        notBeforeTimestampInMillis: now + 3600000, // Válido en 1 hora
        expirationTimestampInMillis: now + 7200000, // Expira en 2 horas
      }));

      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar false si no hay token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();
      expect(isTokenActive()).toBe(false);
    });

    it('debe retornar true cuando el token está en el límite de expiración', () => {
      const now = Date.now();
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'about-to-expire',
        notBeforeTimestampInMillis: now - 3600000, // Comenzó hace 1 hora
        expirationTimestampInMillis: now + 1000, // Expira en 1 segundo
      }));

      expect(isTokenActive()).toBe(true);
    });

    it('debe retornar true cuando el token acaba de activarse', () => {
      const now = Date.now();
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'just-activated',
        notBeforeTimestampInMillis: now - 1000, // Activado hace 1 segundo
        expirationTimestampInMillis: now + 3600000, // Expira en 1 hora
      }));

      expect(isTokenActive()).toBe(true);
    });
  });

  describe('getAccessToken', () => {
    it('debe retornar el accessToken almacenado', () => {
      const testToken = 'my-access-token';
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: testToken,
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000,
      }));

      expect(getAccessToken()).toBe(testToken);
    });

    it('debe retornar string vacío si no hay token', () => {
      expect(getAccessToken()).toBe('');
    });
  });

  describe('getCurrentUser', () => {
    it('debe retornar el usuario si hay un token válido', () => {
      const now = Date.now();
      const mockToken = 'valid-token';
      const mockPayload = {
        _id: 'user123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000),
        exp: Math.floor(now / 1000) + 3600,
      };

      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: mockToken,
        notBeforeTimestampInMillis: now - 1000,
        expirationTimestampInMillis: now + 3600000,
      }));

      mockJwtDecode.mockReturnValue(mockPayload);

      const user = getCurrentUser();

      expect(user).toEqual({
        _id: mockPayload._id,
        active: true,
        email: mockPayload.email,
      });
      expect(mockJwtDecode).toHaveBeenCalledWith(mockToken);
    });

    it('debe retornar undefined si no hay token', () => {
      expect(getCurrentUser()).toBeUndefined();
    });

    it('debe retornar undefined y hacer logout si el token ha expirado', () => {
      const now = Date.now();
      const mockToken = 'expired-token';

      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: mockToken,
        notBeforeTimestampInMillis: now - 7200000,
        expirationTimestampInMillis: now - 3600000, // Expirado
      }));

      const user = getCurrentUser();

      expect(user).toBeUndefined();
      // Verificar que se eliminó el token (logout)
      expect(localStorage.getItem(tokenKey)).toBeNull();
    });
  });

  describe('Integración - Flujo completo de autenticación', () => {
    it('debe permitir login, verificación y logout', () => {
      // 1. Login - setAuthToken
      const mockToken = 'integration-test-token';
      const mockPayload = {
        _id: 'user999',
        email: 'integration@test.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtDecode.mockReturnValue(mockPayload);
      setAuthToken(mockToken);

      // 2. Verificar que está activo
      expect(isTokenActive()).toBe(true);

      // 3. Obtener access token
      expect(getAccessToken()).toBe(mockToken);

      // 4. Obtener usuario actual
      const user = getCurrentUser();
      expect(user).toEqual({
        _id: mockPayload._id,
        active: true,
        email: mockPayload.email,
      });

      // 5. Logout
      removeAuthToken();
      expect(isTokenActive()).toBe(false);
      expect(getAccessToken()).toBe('');
      expect(getCurrentUser()).toBeUndefined();
    });
  });
});


describe('setAuthToken con spy', () => {
  let decodeSpy: jest.SpyInstance;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Limpiar localStorage y mocks
    localStorage.clear();
    jest.clearAllMocks();
    
    // Spy en jwt_decode - podemos verificar llamadas Y ejecutar código real
    decodeSpy = jest.spyOn({ jwt_decode }, 'jwt_decode');
    
    // Mock de localStorage (sí necesita ser mockeado)
    localStorageMock = {};
    Storage.prototype.setItem = jest.fn((key, value) => {
      localStorageMock[key] = value;
    });
  });

  afterEach(() => {
    decodeSpy.mockRestore();
  });

  it('debe llamar jwt_decode con el token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTU0NTYwMH0.abc';
    
    // Limpiar el spy antes de la llamada para contar solo esta ejecución
    decodeSpy.mockClear();
    
    setAuthToken(token);
    
    // Verificar que jwt_decode se llamó con el token
    expect(decodeSpy).toHaveBeenCalledWith(token);
    expect(decodeSpy).toHaveBeenCalledTimes(1);
    
    // El spy ejecutó código real, así que localStorage tiene datos válidos
    const savedValue = localStorageMock[tokenKey];
    expect(savedValue).toBeDefined();
  });
});