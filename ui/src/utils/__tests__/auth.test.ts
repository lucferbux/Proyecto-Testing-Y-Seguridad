import { setAuthToken, removeAuthToken, isTokenActive } from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode
jest.mock('jwt-decode', () => {
  return jest.fn(() => ({
    _id: '123456',
    email: 'test@example.com',
    iat: 1609459200, // 2021-01-01 00:00:00 UTC (segundos)
    exp: 1609545600, // 2021-01-02 00:00:00 UTC (segundos)
  }));
});

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
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  describe('setAuthToken', () => {
    it('debe guardar el token en localStorage', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setAuthToken(mockToken);

      // Verificar que setItem fue llamado
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        tokenKey,
        expect.any(String)
      );
    });

    it('debe convertir timestamps de segundos a milisegundos', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      // JWT usa timestamps en segundos, debemos convertir a milisegundos
      // Verificar que el número es razonable (timestamp en milisegundos es mucho mayor)
      expect(parsedToken.notBeforeTimestampInMillis).toBeGreaterThan(1000000000000);
      expect(parsedToken.expirationTimestampInMillis).toBeGreaterThan(1000000000000);
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

  

});


describe('isTokenActive', () => {
  let localStorageMock: { [key: string]: string };
  const FIXED_TIME = 1609459200000; // 2021-01-01 00:00:00 UTC (milisegundos)

  beforeEach(() => {
    // Limpiar mocks primero
    jest.clearAllMocks();
    
    // Mock completo de localStorage
    localStorageMock = {};
    
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });

    // Mockear Date.now() DESPUÉS de clearAllMocks para evitar condiciones de carrera
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
  });

  afterEach(() => {
    // Restaurar Date.now()
    jest.restoreAllMocks();
  });

  it('debe retornar false cuando no hay token', () => {
    // localStorage vacío
    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar true cuando el token es válido', () => {
    // Token válido: activo y no expirado
    const validToken = {
      accessToken: 'valid-token',
      notBeforeTimestampInMillis: FIXED_TIME - 3600000, // Activo desde hace 1 hora
      expirationTimestampInMillis: FIXED_TIME + 3600000, // Expira en 1 hora
    };

    localStorageMock[tokenKey] = JSON.stringify(validToken);

    expect(isTokenActive()).toBe(true);
  });

  it('debe retornar false cuando el token ha expirado', () => {
    // Token expirado
    const expiredToken = {
      accessToken: 'expired-token',
      notBeforeTimestampInMillis: FIXED_TIME - 7200000, // Activo desde hace 2 horas
      expirationTimestampInMillis: FIXED_TIME - 3600000, // Expiró hace 1 hora
    };

    localStorageMock[tokenKey] = JSON.stringify(expiredToken);

    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar false cuando el token aún no está activo', () => {
    // Token que será activo en el futuro
    const futureToken = {
      accessToken: 'future-token',
      notBeforeTimestampInMillis: FIXED_TIME + 3600000, // Se activa en 1 hora
      expirationTimestampInMillis: FIXED_TIME + 7200000, // Expira en 2 horas
    };

    localStorageMock[tokenKey] = JSON.stringify(futureToken);

    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar true cuando el token está en el límite de expiración', () => {
    // Token que expira en 1 milisegundo (edge case)
    const aboutToExpireToken = {
      accessToken: 'about-to-expire',
      notBeforeTimestampInMillis: FIXED_TIME - 3600000,
      expirationTimestampInMillis: FIXED_TIME + 1, // Expira en 1ms
    };

    localStorageMock[tokenKey] = JSON.stringify(aboutToExpireToken);

    expect(isTokenActive()).toBe(true);
  });

  it('debe retornar true cuando el token acaba de activarse', () => {
    // Token recién activado (edge case)
    const justActivatedToken = {
      accessToken: 'just-activated',
      notBeforeTimestampInMillis: FIXED_TIME, // Activado justo ahora
      expirationTimestampInMillis: FIXED_TIME + 3600000,
    };

    localStorageMock[tokenKey] = JSON.stringify(justActivatedToken);

    expect(isTokenActive()).toBe(true);
  });
});