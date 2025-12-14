import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider } from '../ProjectContext';
import useProject from '../../hooks/useProject';
import { Project } from '../../model/project';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    _id: 'p-1',
    title: 'Test Project',
    description: 'A test project',
    version: '1.0.0',
    link: 'https://example.com',
    tag: 'test',
    timestamp: Date.now(),
    ...overrides
  };
}

describe('ProjectContext (Context API)', () => {
  it('Estado inicial: projects vacío y loading false', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.project).toBeUndefined();
  });

  it('Agregar proyecto: addProject agrega el proyecto al estado y lo selecciona', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-123' });

    act(() => {
      result.current.addProject(p);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject({ _id: 'p-123', title: 'Test Project' });
    expect(result.current.project?._id).toBe('p-123');
  });

  it('Eliminar proyecto: deleteProject elimina por ID y limpia selección si era el seleccionado', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-del' });

    act(() => {
      result.current.addProject(p);
    });

    expect(result.current.projects).toHaveLength(1);

    act(() => {
      result.current.deleteProject('p-del');
    });

    expect(result.current.projects).toHaveLength(0);
    expect(result.current.project).toBeUndefined();
  });

  it('Actualizar proyecto: updateProject actualiza datos y también el seleccionado', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-upd', title: 'Old Title' });

    act(() => {
      result.current.addProject(p);
    });

    act(() => {
      result.current.updateProject({ ...p, title: 'New Title', tag: 'updated' });
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject({
      _id: 'p-upd',
      title: 'New Title',
      tag: 'updated'
    });
    expect(result.current.project?.title).toBe('New Title');
  });

  it('Error handling: eliminar un proyecto inexistente no rompe ni cambia el estado', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-exists' });

    act(() => {
      result.current.addProject(p);
    });

    expect(() => {
      act(() => {
        result.current.deleteProject('does-not-exist');
      });
    }).not.toThrow();

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]._id).toBe('p-exists');
    expect(result.current.project?._id).toBe('p-exists');
  });

  it('Cubre rama: addProject agrega cuando el proyecto NO tiene id/_id', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const noIdProject = makeProject({ _id: undefined } as any);
    delete (noIdProject as any).id;

    act(() => {
      result.current.addProject(noIdProject);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].title).toBe('Test Project');
  });

  it('Cubre rama: updateProject NO modifica si el proyecto NO tiene id/_id', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-ok', title: 'Original' });

    act(() => {
      result.current.addProject(p);
    });

    const updateWithoutId = makeProject({ _id: undefined, title: 'Should Not Apply' } as any);
    delete (updateWithoutId as any).id;

    act(() => {
      result.current.updateProject(updateWithoutId);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]._id).toBe('p-ok');
    expect(result.current.projects[0].title).toBe('Original');
  });

  it('Cubre rama: addProject NO duplica si ya existe un proyecto con el mismo id/_id', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p1 = makeProject({ _id: 'dup-1', title: 'First' });
    const p2 = makeProject({ _id: 'dup-1', title: 'Second object same id' });

    act(() => {
      result.current.addProject(p1);
      result.current.addProject(p2);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]._id).toBe('dup-1');
  });

  it('Cubre removeProject: limpia el proyecto seleccionado', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-selected' });

    act(() => {
      result.current.addProject(p);
    });

    expect(result.current.project?._id).toBe('p-selected');

    act(() => {
      result.current.removeProject();
    });

    expect(result.current.project).toBeUndefined();
  });

  it('Cubre deleteProject: si elimino el seleccionado, project queda undefined', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p1 = makeProject({ _id: 'p-1' });
    const p2 = makeProject({ _id: 'p-2' });

    act(() => {
      result.current.addProject(p1); // seleccionado = p1
      result.current.addProject(p2); // seleccionado = p2
    });

    expect(result.current.project?._id).toBe('p-2');

    act(() => {
      result.current.deleteProject('p-2'); // elimino el seleccionado
    });

    expect(result.current.projects.map((p) => p._id)).toEqual(['p-1']);
    expect(result.current.project).toBeUndefined();
  });

  it('Cubre updateProject: actualiza también el proyecto seleccionado (merge en setProject)', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    const p = makeProject({ _id: 'p-merge', title: 'Old', tag: 'old' });

    act(() => {
      result.current.addProject(p); // seleccionado = p
    });

    // actualizo con un objeto que tiene el mismo id pero diferentes campos
    const updated = makeProject({ _id: 'p-merge', title: 'New', tag: 'new' });

    act(() => {
      result.current.updateProject(updated);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]).toMatchObject({ _id: 'p-merge', title: 'New', tag: 'new' });
    expect(result.current.project).toMatchObject({ _id: 'p-merge', title: 'New', tag: 'new' });
  });

  it('Cubre deleteProject (línea ~68): si el seleccionado tiene id (sin _id) y lo elimino, project queda undefined', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    // Creamos un seleccionado con id-only
    const selected: any = makeProject({ _id: undefined } as any);
    selected.id = 'sel-id';

    act(() => {
      result.current.addProject(selected); // project seleccionado = selected
    });

    expect(result.current.project?.id ?? result.current.project?._id).toBe('sel-id');

    act(() => {
      result.current.deleteProject('sel-id'); // debe limpiar selección
    });

    expect(result.current.projects).toHaveLength(0);
    expect(result.current.project).toBeUndefined();
  });

  it('Cubre updateProject (líneas ~81–86): si el seleccionado tiene id (sin _id) y lo actualizo, project se actualiza', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    // Seleccionado id-only
    const p: any = makeProject({ _id: undefined, title: 'Old', tag: 'old' } as any);
    p.id = 'upd-id';

    act(() => {
      result.current.addProject(p);
    });

    // Actualización con mismo id-only
    const updated: any = makeProject({ _id: undefined, title: 'New', tag: 'new' } as any);
    updated.id = 'upd-id';

    act(() => {
      result.current.updateProject(updated);
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].title).toBe('New');
    expect(result.current.project?.title).toBe('New');
    expect(result.current.project?.tag).toBe('new');
  });
});
