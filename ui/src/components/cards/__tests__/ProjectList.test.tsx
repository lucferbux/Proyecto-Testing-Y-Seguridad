import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// ==================== MOCK DEL API CLIENT ====================
// Los mocks deben definirse ANTES del import del componente
// Usamos jest.fn() inline dentro del mock para evitar problemas de hoisting
const mockGetProjects = jest.fn();
const mockGetAboutMe = jest.fn();

jest.mock('../../../api/api-client-factory', () => {
  // Esta función se ejecuta durante el hoisting, por eso necesitamos
  // que mockGetProjects ya esté definido como jest.fn() arriba
  return {
    __esModule: true,
    default: () => ({
      getProjects: mockGetProjects,
      getAboutMe: mockGetAboutMe,
    }),
  };
});

// Import del componente DESPUÉS del mock
import { ProjectList } from '../ProjectList';

// ==================== DATOS MOCK ====================
const mockProjects = [
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Taller Testing & Security',
    description: 'Proyecto educativo sobre testing y seguridad en aplicaciones web',
    version: '1.0.0',
    link: 'https://github.com/lucferbux/Taller-Testing-Security',
    tag: 'education',
    timestamp: Date.now()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'React Dashboard',
    description: 'Dashboard administrativo con React y TypeScript',
    version: '2.1.0',
    link: 'https://github.com/lucferbux/react-dashboard',
    tag: 'react',
    timestamp: Date.now() - 86400000
  }
];

describe('ProjectList Component', () => {
  
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  // ==================== HAPPY PATH ====================
  
  it('debe mostrar loading inicialmente', () => {
    // Setup: el mock no resuelve inmediatamente
    mockGetProjects.mockImplementation(() => new Promise(() => {}));
    
    render(<ProjectList />);
    
    expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();
  });

  it('debe cargar y mostrar proyectos desde la API', async () => {
    // Setup: el mock resuelve con proyectos
    mockGetProjects.mockResolvedValueOnce(mockProjects);
    
    render(<ProjectList />);

    // Esperamos a que desaparezca el loading
    await waitFor(() => {
      expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
    });

    // Verificamos que los proyectos mockeados aparecen
    expect(screen.getByText('Taller Testing & Security')).toBeInTheDocument();
    expect(screen.getByText('React Dashboard')).toBeInTheDocument();
  });

  it('debe mostrar todos los detalles de cada proyecto', async () => {
    mockGetProjects.mockResolvedValueOnce(mockProjects);
    
    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
    });

    // Verificamos descripción, versión y tag
    expect(screen.getByText(/Proyecto educativo sobre testing/)).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('education')).toBeInTheDocument();
  });

  // ==================== ERROR HANDLING ====================

  it('debe manejar errores de servidor (500)', async () => {
    // Simulamos un error
    mockGetProjects.mockRejectedValueOnce(new Error('Internal server error'));

    render(<ProjectList />);

    // Esperamos a que aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    // Verificamos que NO hay proyectos mostrados
    expect(screen.queryByText('Taller Testing & Security')).not.toBeInTheDocument();
  });

  it('debe manejar errores de red', async () => {
    // Simulamos un error de red
    mockGetProjects.mockRejectedValueOnce(new Error('Network error'));

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('debe manejar respuesta vacía', async () => {
    // Handler que retorna array vacío
    mockGetProjects.mockResolvedValueOnce([]);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('No hay proyectos disponibles')).toBeInTheDocument();
    });

    // No debería haber elementos en la lista
    const list = screen.queryByRole('list');
    expect(list).not.toBeInTheDocument();
  });

  // ==================== DELAYS Y TIMEOUTS ====================

  it('debe manejar respuestas lentas', async () => {
    // Simulamos un endpoint lento
    mockGetProjects.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve([
            {
              _id: 'slow-id',
              title: 'Slow Loading Project',
              description: 'Este proyecto tardó en cargar',
              version: '1.0.0',
              link: '',
              tag: 'slow',
              timestamp: Date.now()
            }
          ]);
        }, 100);
      })
    );

    render(<ProjectList />);

    // Loading debe estar presente durante el delay
    expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();

    // Esperamos a que cargue
    await waitFor(() => {
      expect(screen.getByText('Slow Loading Project')).toBeInTheDocument();
    });
  });

  // ==================== VERIFICACIÓN DE LLAMADAS ====================

  it('debe llamar a getProjects al montar', async () => {
    mockGetProjects.mockResolvedValueOnce(mockProjects);
    mockGetProjects.mockResolvedValueOnce(mockProjects); // Segunda llamada por StrictMode
    
    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
    });

    // Verificamos que se llamó (React 18 StrictMode puede llamar 2 veces en dev)
    expect(mockGetProjects).toHaveBeenCalled();
    // En entorno real de producción sería 1, pero en test con React 18 puede ser 2
    expect(mockGetProjects.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
