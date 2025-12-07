import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../ProjectCard';
import useAuth from '../../../hooks/useAuth';
import { Project } from '../../../model/project';

// Mock de api-client-factory (necesario para evitar import.meta.env)
jest.mock('../../../api/api-client-factory', () => ({
  getApiClient: jest.fn(),
}));

// Mock del hook useAuth
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProjectCard', () => {
  const mockCloseButton = jest.fn();
  const mockUpdateButton = jest.fn();

  const mockProject: Project = {
    _id: '123',
    title: 'Test Project',
    description: 'A test project description',
    link: 'https://example.com',
    version: 'v1.0',
    tag: 'React',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar información del proyecto', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined, 
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('A test project description')).toBeInTheDocument();
      expect(screen.getByText('v1.0')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('debe renderizar caption text cuando se proporciona', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
          captionText="Featured Project"
        />
      );

      expect(screen.getByTestId('caption')).toHaveTextContent('Featured Project');
    });

    it('debe tener un link al proyecto', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      const { container } = render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const link = container.querySelector('a[href="https://example.com"]');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });
  });

  describe('Comportamiento con autenticación', () => {
    it('NO debe mostrar botón kebab cuando no hay usuario', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // No debe haber botón con 3 puntos
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('debe mostrar botón kebab cuando hay usuario autenticado', () => {
      mockUseAuth.mockReturnValue({ 
        user: { _id: 'user1', email: 'test@example.com', active: true },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Interacciones del menu dropdown', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ 
        user: { _id: 'user1', email: 'test@example.com', active: true },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loadUser: jest.fn()
      });
    });

    it('debe mostrar menu al hacer click en kebab button', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Inicialmente el menu no está visible
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();

      // Click en el botón kebab (primer botón)
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Ahora el menu debe estar visible
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('debe llamar updateButton al hacer click en Update', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Abrir menu
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Click en Update
      const updateBtn = screen.getByText('Update');
      fireEvent.click(updateBtn);

      expect(mockUpdateButton).toHaveBeenCalledTimes(1);
      expect(mockUpdateButton).toHaveBeenCalledWith(
        expect.any(Object),  // Event
        mockProject
      );
    });

    it('debe llamar closeButton al hacer click en Delete', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Abrir menu
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Click en Delete
      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn);

      expect(mockCloseButton).toHaveBeenCalledTimes(1);
      expect(mockCloseButton).toHaveBeenCalledWith(
        expect.any(Object),  // Event
        '123'  // project._id
      );
    });
  });
});