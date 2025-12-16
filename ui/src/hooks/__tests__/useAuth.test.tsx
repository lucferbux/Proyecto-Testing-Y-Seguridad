import React from 'react';
import { renderHook } from '@testing-library/react';
import useAuth from '../useAuth';
import AuthContext from '../../context/AuthContext';
import { ReactNode } from 'react';

jest.mock('../../api/api-client-factory');

describe('useAuth', () => {
  it('debe retornar el contexto de autenticación', () => {
    // Mock del valor del context
    const mockContextValue = {
      user: { _id: '1', email: 'test@example.com', active: true },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      loadUser: jest.fn()
    };

    // Wrapper que provee el Context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    // Renderizar hook con el wrapper
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verificar que retorna el context completo
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('debe lanzar error si se usa fuera del AuthProvider', () => {
    // Sin wrapper (sin Provider)
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});