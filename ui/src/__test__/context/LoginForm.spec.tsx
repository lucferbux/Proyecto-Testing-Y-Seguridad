import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from '../../components/LoginForm';
import * as authUtils from '../../utils/auth';
import createApiClient from '../../api/api-client-factory';

jest.mock('../../utils/auth');
jest.mock('../../api/api-client-factory');

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm Integration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(undefined);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(false);
  });

  it('debe renderizar el formulario inicialmente', () => {
    renderWithAuth(<LoginForm />);
    
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('debe hacer login exitosamente', async () => {
    const user = userEvent.setup();
    
    // Mock exitoso
    const mockToken = jest.fn().mockResolvedValue({ token: 'jwt-token' });
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    const mockUser = { _id: '1', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    renderWithAuth(<LoginForm />);
    
    // Llenar formulario
    await user.type(screen.getByLabelText('email'), 'test@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificar mensaje de bienvenida
    await waitFor(() => {
      expect(screen.getByText('Welcome, test@example.com!')).toBeInTheDocument();
    });
    
    // El formulario debe desaparecer
    expect(screen.queryByLabelText('email')).not.toBeInTheDocument();
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    
    // Mock que falla
    const mockToken = jest.fn().mockRejectedValue(new Error());
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'bad@example.com');
    await user.type(screen.getByLabelText('password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Esperar error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    
    // Formulario sigue visible
    expect(screen.getByLabelText('email')).toBeInTheDocument();
  });

  it('debe deshabilitar el botón durante login', async () => {
    const user = userEvent.setup();
    
    // Mock que demora
    const mockToken = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'test@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // El botón debe estar deshabilitado y mostrar texto de carga
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Logging in...');
  });
});