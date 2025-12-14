import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';
import * as authUtils from '../../utils/auth';
import createApiClient from '../../api/api-client-factory';

// Mockeamos dependencias externas
jest.mock('../../utils/auth');
jest.mock('../../api/api-client-factory', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    token: jest.fn(), // implementación por defecto (se sobreescribe en cada test)
  })),
}));

// Componente de prueba
function AuthStatus() {
  const { user, isLoading, login, logout } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login('testuser', 'password123');
    } catch (error) {
      // Ignoramos el error ya que es esperado en el test de error
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <>
          <p>User: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button onClick={handleLogin}>Login</button>
        </>
      )}
    </div>
  );
}

describe('AuthContext Integration', () => {
  
  beforeEach(() => {
    // Reseteamos todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Configuramos comportamiento por defecto de auth utils
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(undefined);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(false);
  });

  it('debe iniciar sin usuario si no hay token', () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });

  it('debe hacer login exitosamente', async () => {
    // Mock del API client
    const mockToken = jest.fn().mockResolvedValue({ token: 'fake-jwt-token' });
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    // Mock de getCurrentUser después del login
    const mockUser = { _id: '123', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Hacemos click en login
    fireEvent.click(screen.getByText('Login'));
    
    // Verificamos loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Esperamos a que termine el login
    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
    
    // Verificamos que se llamó al API correctamente
    expect(mockToken).toHaveBeenCalledWith('testuser', 'password123');
    expect(authUtils.setAuthToken).toHaveBeenCalledWith('fake-jwt-token');
  });

  it('debe manejar errores de login', async () => {
    // Mock que simula error de API
    const mockToken = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Intentamos login
    fireEvent.click(screen.getByText('Login'));
    
    // Esperamos a que termine (con error)
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
    
    // El loading debe desaparecer
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('debe hacer logout correctamente', async () => {
    // Configuramos estado inicial con usuario logueado
    const mockUser = { _id: '123', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(true);
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Verificamos que está logueado
    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    
    // Hacemos logout
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
    
    // Verificamos que se llamó al servicio de logout
    expect(authUtils.logout).toHaveBeenCalled();
  });
});