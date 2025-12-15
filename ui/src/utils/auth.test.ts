import {
  setAuthToken,
  removeAuthToken,
  isTokenActive,
  getAccessToken,
  getCurrentUser,
  logout,
  setLogoutIfExpiredHandler
} from './auth';
import { tokenKey } from '../constants/config';
import jwt_decode from 'jwt-decode';

jest.mock('jwt-decode');

describe('Auth Utils', () => {
  const mockToken = 'mock.jwt.token';
  const mockDecodedToken = {
    _id: 'user123',
    email: 'test@example.com',
    iat: 1600000000,
    exp: 1700000000, 
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    (jwt_decode as jest.Mock).mockReturnValue(mockDecodedToken);

    jest.useFakeTimers();
    jest.setSystemTime(1650000000000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('setAuthToken', () => {
    it('should decode token and save it to localStorage', () => {
      setAuthToken(mockToken);

      expect(jwt_decode).toHaveBeenCalledWith(mockToken);
      
      const storedToken = JSON.parse(localStorage.getItem(tokenKey) || '{}');
      expect(storedToken).toEqual({
        accessToken: mockToken,
        notBeforeTimestampInMillis: mockDecodedToken.iat * 1000,
        expirationTimestampInMillis: mockDecodedToken.exp * 1000,
      });
    });

    it('should throw error if token is invalid (jwt_decode fails)', () => {
        (jwt_decode as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        expect(() => setAuthToken('invalid.token')).toThrow('Invalid token');
        expect(localStorage.getItem(tokenKey)).toBeNull();
    });
  });

  describe('removeAuthToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem(tokenKey, 'some-data');
      removeAuthToken();
      expect(localStorage.getItem(tokenKey)).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token if it exists in localStorage', () => {
      const tokenData = {
        accessToken: mockToken,
        notBeforeTimestampInMillis: 1000,
        expirationTimestampInMillis: 9999999999999,
      };
      localStorage.setItem(tokenKey, JSON.stringify(tokenData));

      expect(getAccessToken()).toBe(mockToken);
    });

    it('should return empty string if no token in localStorage', () => {
      expect(getAccessToken()).toBe('');
    });

    it('should throw error if localStorage contains invalid JSON', () => {
        localStorage.setItem(tokenKey, '{invalid-json');
        expect(() => getAccessToken()).toThrow();
    });
  });

  describe('isTokenActive', () => {
    it('should return true for a valid active token', () => {
      setAuthToken(mockToken);
      
      expect(isTokenActive()).toBe(true);
    });

    it('should return false if token is expired', () => {
      setAuthToken(mockToken);
      

      jest.setSystemTime(1800000000000);
      
      expect(isTokenActive()).toBe(false);
    });

    it('should return false if token is not yet valid (before iat/nbf)', () => {
      setAuthToken(mockToken);
      

      jest.setSystemTime(1500000000000);
      
      expect(isTokenActive()).toBe(false);
    });

    it('should return false if no token exists', () => {
      expect(isTokenActive()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user details if token is valid', () => {
      setAuthToken(mockToken);
      
      const user = getCurrentUser();
      
      expect(user).toEqual({
        _id: mockDecodedToken._id,
        active: true,
        email: mockDecodedToken.email,
      });
    });

    it('should return undefined and logout if token is expired', () => {
      setAuthToken(mockToken);
      
      jest.setSystemTime(1800000000000);
      
      const user = getCurrentUser();
      
      expect(user).toBeUndefined();
      expect(localStorage.getItem(tokenKey)).toBeNull(); 
    });

    it('should return undefined if no token exists', () => {
      const user = getCurrentUser();
      expect(user).toBeUndefined();
    });
  });

  describe('setLogoutIfExpiredHandler', () => {
      it('should set a timeout to logout user when token expires', () => {
          const setUserMock = jest.fn();
          setAuthToken(mockToken);
          
          setLogoutIfExpiredHandler(setUserMock);
          
          expect(setUserMock).not.toHaveBeenCalled();
          
          jest.runAllTimers();
          
          expect(setUserMock).toHaveBeenCalledWith(undefined);
      });

      it('should do nothing if token is not active', () => {
          const setUserMock = jest.fn();
          setLogoutIfExpiredHandler(setUserMock);
          
          jest.runAllTimers();
          expect(setUserMock).not.toHaveBeenCalled();
      });
  });
});
