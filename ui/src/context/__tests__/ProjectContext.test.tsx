import { useContext, ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import ProjectContext, { ProjectProvider } from '../ProjectContext';
import { Project } from '../../model/project';

describe('ProjectContext', () => {
  const mockProject: Project = {
    _id: '1',
    title: 'Test Project',
    description: 'Description',
    link: 'http://test.com',
    version: '1.0',
    tag: 'tag',
    timestamp: 1234567890
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProjectProvider>{children}</ProjectProvider>
  );

  it('debe tener el estado inicial correcto', () => {
    const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.currentProject).toBeUndefined();
  });

  it('debe agregar un proyecto correctamente', () => {
    const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

    act(() => {
      result.current.addProject(mockProject);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toEqual(mockProject);
  });

  it('debe eliminar un proyecto correctamente', () => {
    const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

    // Primero agregamos
    act(() => {
      result.current.addProject(mockProject);
    });
    expect(result.current.projects).toHaveLength(1);

    // Luego eliminamos
    act(() => {
      result.current.deleteProject(mockProject._id!);
    });

    expect(result.current.projects).toHaveLength(0);
  });

  it('debe actualizar un proyecto correctamente', () => {
    const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

    // Agregamos
    act(() => {
      result.current.addProject(mockProject);
    });

    const updatedProject = { ...mockProject, title: 'Updated Title' };

    // Actualizamos
    act(() => {
      result.current.updateProject(updatedProject);
    });

    expect(result.current.projects[0].title).toBe('Updated Title');
    expect(result.current.projects).toHaveLength(1);
  });

  it('no debe romper la aplicación al intentar eliminar un proyecto inexistente', () => {
    const { result } = renderHook(() => useContext(ProjectContext), { wrapper });

    act(() => {
      result.current.addProject(mockProject);
    });

    act(() => {
      result.current.deleteProject('non-existent-id');
    });

    // El estado debe permanecer igual
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toEqual(mockProject);
  });
});
