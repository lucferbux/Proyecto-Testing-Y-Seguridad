import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectProvider } from '../ProjectContext';
import useProject from '../../hooks/useProject';
import { Project } from '../../model/project';

// Componente de prueba que consume ProjectContext
function TestConsumer() {
  const { projects, loading, addProject, deleteProject, updateProject } = useProject();
  const [error, setError] = React.useState<string | null>(null);

  const testProject: Project = {
    _id: '123',
    title: 'Test Project',
    description: 'A test project',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now()
  };

  const handleAdd = () => {
    addProject(testProject);
    setError(null);
  };

  const handleAddSecond = () => {
    const secondProject: Project = {
      _id: '456',
      title: 'Second Project',
      description: 'Another test project',
      version: '2.0.0',
      link: 'https://github.com/test2',
      tag: 'test2',
      timestamp: Date.now()
    };
    addProject(secondProject);
  };

  const handleDelete = (id: string) => {
    try {
      deleteProject(id);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdate = () => {
    const updatedProject: Project = {
      _id: '123',
      title: 'Updated Project',
      description: 'Updated description',
      version: '2.0.0',
      link: 'https://github.com/updated',
      tag: 'updated',
      timestamp: Date.now()
    };
    updateProject(updatedProject);
  };

  return (
    <div>
      <p data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</p>
      <p data-testid="count">{projects.length}</p>
      {error && <p data-testid="error">{error}</p>}
      {projects.map((p) => (
        <div key={p._id} data-testid={`project-${p._id}`}>
          <span data-testid={`title-${p._id}`}>{p.title}</span>
          <span data-testid={`description-${p._id}`}>{p.description}</span>
          <button onClick={() => handleDelete(p._id!)}>Delete {p._id}</button>
        </div>
      ))}
      <button onClick={handleAdd}>Add Project</button>
      <button onClick={handleAddSecond}>Add Second Project</button>
      <button onClick={handleUpdate}>Update Project</button>
      <button onClick={() => handleDelete('non-existent')}>Delete Non-Existent</button>
    </div>
  );
}

describe('ProjectContext', () => {
  // Test 1: Estado inicial - projects vacio y loading false
  describe('Estado inicial', () => {
    it('debe tener projects vacio inicialmente', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('debe tener loading en false inicialmente', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  // Test 2: Agregar proyecto
  describe('addProject', () => {
    it('debe agregar un proyecto valido al array', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Verificar estado inicial
      expect(screen.getByTestId('count')).toHaveTextContent('0');

      // Agregar proyecto
      fireEvent.click(screen.getByText('Add Project'));

      // Verificar que el proyecto se agrego
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('title-123')).toHaveTextContent('Test Project');
      expect(screen.getByTestId('description-123')).toHaveTextContent('A test project');
    });

    it('debe permitir agregar multiples proyectos', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar dos proyectos
      fireEvent.click(screen.getByText('Add Project'));
      fireEvent.click(screen.getByText('Add Second Project'));

      // Verificar que ambos proyectos estan en el array
      expect(screen.getByTestId('count')).toHaveTextContent('2');
      expect(screen.getByTestId('title-123')).toHaveTextContent('Test Project');
      expect(screen.getByTestId('title-456')).toHaveTextContent('Second Project');
    });
  });

  // Test 3: Eliminar proyecto
  describe('deleteProject', () => {
    it('debe eliminar un proyecto por ID', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar proyecto
      fireEvent.click(screen.getByText('Add Project'));
      expect(screen.getByTestId('count')).toHaveTextContent('1');

      // Eliminar proyecto
      fireEvent.click(screen.getByText('Delete 123'));

      // Verificar que se elimino
      expect(screen.getByTestId('count')).toHaveTextContent('0');
      expect(screen.queryByTestId('project-123')).not.toBeInTheDocument();
    });

    it('debe eliminar solo el proyecto especificado', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar dos proyectos
      fireEvent.click(screen.getByText('Add Project'));
      fireEvent.click(screen.getByText('Add Second Project'));
      expect(screen.getByTestId('count')).toHaveTextContent('2');

      // Eliminar solo el primero
      fireEvent.click(screen.getByText('Delete 123'));

      // Verificar que solo queda el segundo
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.queryByTestId('project-123')).not.toBeInTheDocument();
      expect(screen.getByTestId('project-456')).toBeInTheDocument();
    });
  });

  // Test 4: Actualizar proyecto
  describe('updateProject', () => {
    it('debe actualizar los datos de un proyecto existente', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar proyecto
      fireEvent.click(screen.getByText('Add Project'));
      expect(screen.getByTestId('title-123')).toHaveTextContent('Test Project');
      expect(screen.getByTestId('description-123')).toHaveTextContent('A test project');

      // Actualizar proyecto
      fireEvent.click(screen.getByText('Update Project'));

      // Verificar que los datos cambiaron
      expect(screen.getByTestId('title-123')).toHaveTextContent('Updated Project');
      expect(screen.getByTestId('description-123')).toHaveTextContent('Updated description');
    });

    it('no debe afectar otros proyectos al actualizar', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar dos proyectos
      fireEvent.click(screen.getByText('Add Project'));
      fireEvent.click(screen.getByText('Add Second Project'));

      // Actualizar solo el primero
      fireEvent.click(screen.getByText('Update Project'));

      // Verificar que el segundo no cambio
      expect(screen.getByTestId('title-456')).toHaveTextContent('Second Project');
      expect(screen.getByTestId('description-456')).toHaveTextContent('Another test project');
    });
  });

  // Test 5: Error handling
  describe('Error handling', () => {
    it('no debe romper la aplicacion al eliminar proyecto inexistente', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Intentar eliminar proyecto que no existe
      // La aplicacion no debe crashear
      expect(() => {
        fireEvent.click(screen.getByText('Delete Non-Existent'));
      }).not.toThrow();

      // El estado debe seguir funcionando normalmente
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('debe mantener el estado consistente despues de operacion fallida', () => {
      render(
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      );

      // Agregar un proyecto
      fireEvent.click(screen.getByText('Add Project'));
      expect(screen.getByTestId('count')).toHaveTextContent('1');

      // Intentar eliminar uno inexistente
      fireEvent.click(screen.getByText('Delete Non-Existent'));

      // El proyecto existente debe seguir ahi
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('project-123')).toBeInTheDocument();
    });
  });
});
