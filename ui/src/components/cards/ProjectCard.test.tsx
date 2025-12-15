import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project } from '../../model/project';
import '@testing-library/jest-dom';

// Mock useAuth hook
const mockUser = { email: 'test@test.com' };
const mockUseAuth = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockUseAuth(),
}));

describe('ProjectCard Component', () => {
  const mockProject: Project = {
    _id: '1',
    title: 'Test Project',
    description: 'Test Description',
    link: 'http://test.com',
    version: '1.0.0',
    tag: 'React',
    timestamp: 1234567890,
  };

  const mockCloseButton = jest.fn();
  const mockUpdateButton = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });

  // Verifica que la información del proyecto (título, descripción, versión, tag) se muestre correctamente
  it('renders project information correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    expect(screen.getByText(mockProject.version)).toBeInTheDocument();
    expect(screen.getByText(mockProject.tag)).toBeInTheDocument();
  });

  // Verifica que el menú de administración (actualizar/eliminar) NO se muestre si el usuario no está logueado
  it('does not show admin menu when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null });
    
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    expect(screen.queryByText('Update')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  // Verifica que el menú de administración se muestre y funcione correctamente cuando el usuario está logueado
  it('shows admin menu and handles interactions when user is logged in', () => {
    mockUseAuth.mockReturnValue({ user: mockUser });

    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
      />
    );

    const menuButton = screen.getByRole('button'); 
    fireEvent.click(menuButton);

    const updateOption = screen.getByText('Update');
    const deleteOption = screen.getByText('Delete');
    expect(updateOption).toBeInTheDocument();
    expect(deleteOption).toBeInTheDocument();

    fireEvent.click(updateOption);
    expect(mockUpdateButton).toHaveBeenCalledWith(expect.any(Object), mockProject);

    fireEvent.click(deleteOption);
    expect(mockCloseButton).toHaveBeenCalledWith(expect.any(Object), mockProject._id);
  });

  // Verifica que se renderice un texto de "caption" adicional si se proporciona
  it('renders caption text if provided', () => {
    const caption = 'Featured Project';
    render(
      <ProjectCard
        project={mockProject}
        closeButton={mockCloseButton}
        updateButton={mockUpdateButton}
        captionText={caption}
      />
    );

    expect(screen.getByTestId('caption')).toHaveTextContent(caption);
  });
});
