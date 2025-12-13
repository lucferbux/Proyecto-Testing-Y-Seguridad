import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectCard from '../ProjectCard';
import { Project } from '../../../model/project';

// Mock de los hooks
const mockUseAuth = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockUseAuth()
}));

// Mock de los assets
jest.mock('../code.svg', () => 'code-icon.svg');

// Datos mock para las pruebas
const mockProject: Project = {
  _id: 'project-123',
  title: 'Test Project',
  description: 'A test project description',
  version: 'v1.0.0',
  link: 'https://example.com/project',
  tag: 'React',
  timestamp: Date.now()
};

const mockProjectWithoutId: Project = {
  title: 'New Project',
  description: 'A new project without ID',
  version: 'v0.1.0',
  link: 'https://example.com/new-project',
  tag: 'TypeScript',
  timestamp: Date.now()
};

// Mock user
const mockUser = {
  _id: 'user-123',
  email: 'test@example.com',
  active: true
};

// Mock callback functions
const mockCloseButton = jest.fn();
const mockUpdateButton = jest.fn();

describe('ProjectCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto, no hay usuario autenticado
    mockUseAuth.mockReturnValue({ user: undefined });
  });

  // ============================================
  // Renderizado Básico Tests
  // ============================================
  describe('Renderizado básico', () => {
    it('debe renderizar el título del proyecto', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    });

    it('debe renderizar la descripción del proyecto', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    });

    it('debe renderizar la versión del proyecto', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(mockProject.version)).toBeInTheDocument();
    });

    it('debe renderizar el tag del proyecto', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(mockProject.tag)).toBeInTheDocument();
    });

    it('debe renderizar el link con atributos correctos para seguridad', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', mockProject.link);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });
  });

  // ============================================
  // Tests de Props
  // ============================================
  describe('Props', () => {
    it('debe mostrar captionText cuando se proporciona', () => {
      const captionText = 'Featured Project';
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
          captionText={captionText}
        />
      );

      expect(screen.getByTestId('caption')).toHaveTextContent(captionText);
    });

    it('debe renderizar vacío el caption cuando no se proporciona captionText', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByTestId('caption')).toHaveTextContent('');
    });

    it('debe manejar proyecto sin _id correctamente', () => {
      render(
        <ProjectCard
          project={mockProjectWithoutId}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(mockProjectWithoutId.title)).toBeInTheDocument();
    });
  });

  // ============================================
  // Tests de Estados Condicionales (Usuario Autenticado)
  // ============================================
  describe('Estados condicionales - Usuario autenticado', () => {
    it('NO debe mostrar botón kebab cuando usuario NO está autenticado', () => {
      mockUseAuth.mockReturnValue({ user: undefined });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('debe mostrar botón kebab cuando usuario ESTÁ autenticado', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('debe ocultar menú desplegable inicialmente cuando usuario está autenticado', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.queryByText('Update')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Tests de Interacciones de Usuario
  // ============================================
  describe('Interacciones de usuario', () => {
    it('debe mostrar menú desplegable al hacer clic en botón kebab', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const kebabButton = screen.getByRole('button');
      fireEvent.click(kebabButton);

      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('debe llamar a updateButton al hacer clic en Update', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const kebabButton = screen.getByRole('button');
      fireEvent.click(kebabButton);

      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      expect(mockUpdateButton).toHaveBeenCalledTimes(1);
      expect(mockUpdateButton).toHaveBeenCalledWith(expect.any(Object), mockProject);
    });

    it('debe llamar a closeButton al hacer clic en Delete', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const kebabButton = screen.getByRole('button');
      fireEvent.click(kebabButton);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockCloseButton).toHaveBeenCalledTimes(1);
      expect(mockCloseButton).toHaveBeenCalledWith(expect.any(Object), mockProject._id);
    });
  });

  // ============================================
  // Tests de Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('debe manejar proyecto con descripción muy larga', () => {
      const projectWithLongDesc = {
        ...mockProject,
        description: 'A'.repeat(500)
      };

      render(
        <ProjectCard
          project={projectWithLongDesc}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(projectWithLongDesc.description)).toBeInTheDocument();
    });

    it('debe manejar proyecto con caracteres especiales', () => {
      const projectWithSpecialChars = {
        ...mockProject,
        title: '¡Proyecto Especial! @#$%',
        description: 'Descripción con émojis 🚀 y caracteres 日本語'
      };

      render(
        <ProjectCard
          project={projectWithSpecialChars}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText(projectWithSpecialChars.title)).toBeInTheDocument();
      expect(screen.getByText(projectWithSpecialChars.description)).toBeInTheDocument();
    });

    it('debe pasar string vacío a closeButton cuando project._id es undefined', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });

      render(
        <ProjectCard
          project={mockProjectWithoutId}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const kebabButton = screen.getByRole('button');
      fireEvent.click(kebabButton);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockCloseButton).toHaveBeenCalledWith(expect.any(Object), '');
    });
  });

  // ============================================
  // Tests de Accesibilidad
  // ============================================
  describe('Accesibilidad', () => {
    it('debe tener un link accesible al proyecto', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('debe tener imagen del icono con alt text', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const icon = screen.getByAltText('Icon Tag Project');
      expect(icon).toBeInTheDocument();
    });
  });
});
