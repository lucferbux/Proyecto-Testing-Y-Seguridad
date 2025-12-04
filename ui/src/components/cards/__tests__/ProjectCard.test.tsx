// src/components/cards/__tests__/ProjectCard.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '../../../model/project';

// Mock de hooks
jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../hooks/useToogle', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useAuth from '../../../hooks/useAuth';
import useToggle from '../../../hooks/useToogle';

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToggle = useToggle as jest.Mock;

const fakeProject: Project = {
  _id: 'project-1',
  title: 'Mi Proyecto',
  description: 'Descripción del proyecto',
  version: 'v1.0',
  link: 'https://example.com',
  tag: 'React, TypeScript',
  timestamp: 1234567890,
};

describe('ProjectCard', () => {
  const closeButton = jest.fn();
  const updateButton = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza los datos básicos del proyecto', () => {
    mockedUseAuth.mockReturnValue({ user: undefined });
    mockedUseToggle.mockReturnValue([false, jest.fn()]);

    render(
      <ProjectCard
        project={fakeProject}
        closeButton={closeButton}
        updateButton={updateButton}
      />,
    );

    expect(screen.getByText('Mi Proyecto')).toBeInTheDocument();
    expect(screen.getByText('Descripción del proyecto')).toBeInTheDocument();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('React, TypeScript')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', fakeProject.link);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('no muestra el botón de menú cuando no hay usuario autenticado', () => {
    mockedUseAuth.mockReturnValue({ user: undefined });
    mockedUseToggle.mockReturnValue([false, jest.fn()]);

    render(
      <ProjectCard
        project={fakeProject}
        closeButton={closeButton}
        updateButton={updateButton}
      />,
    );

    // el kebab button no tiene texto, buscamos por role button
    // Usamos `queryAllByRole` porque `getAllByRole` lanza si no hay coincidencias
    const buttons = screen.queryAllByRole('button');
    // El único botón esperable sería del menú; como no hay user, no debe existir
    expect(buttons.length).toBe(0);
  });

  it('muestra el botón de menú cuando hay usuario autenticado', () => {
    mockedUseAuth.mockReturnValue({ user: { _id: '1', email: 'a@b.com' } });
    mockedUseToggle.mockReturnValue([false, jest.fn()]);

    render(
      <ProjectCard
        project={fakeProject}
        closeButton={closeButton}
        updateButton={updateButton}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('cuando el menú está visible, hace click en Update y Delete', () => {
    mockedUseAuth.mockReturnValue({ user: { _id: '1', email: 'a@b.com' } });
    // isVisible = true para que el menú se renderice
    mockedUseToggle.mockReturnValue([true, jest.fn()]);

    render(
      <ProjectCard
        project={fakeProject}
        closeButton={closeButton}
        updateButton={updateButton}
      />,
    );

    const updateOption = screen.getByText('Update');
    fireEvent.click(updateOption);
    expect(updateButton).toHaveBeenCalledTimes(1);
    expect(updateButton).toHaveBeenCalledWith(expect.any(Object), fakeProject);

    const deleteOption = screen.getByText(/delete/i);
    fireEvent.click(deleteOption);
    expect(closeButton).toHaveBeenCalledTimes(1);
    expect(closeButton).toHaveBeenCalledWith(
      expect.any(Object),
      fakeProject._id,
    );
  });
});
