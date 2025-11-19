import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectProvider } from '../../context/ProjectContext';
import useProject from '../../hooks/useProject';
import { Project } from '../../model/project';

// Componente de prueba que consume ProjectContext
function ProjectDisplay() {
  const { project, addProject, removeProject } = useProject();

  const handleAdd = () => {
    const newProject: Project = {
      _id: '123',
      title: 'Test Project',
      description: 'A test project',
      version: '',
      link: '',
      tag: '',
      timestamp: 0
    };
    addProject(newProject);
  };

  return (
    <div>
      {project ? (
        <>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <button onClick={removeProject}>Remove Project</button>
        </>
      ) : (
        <>
          <p>No project</p>
          <button onClick={handleAdd}>Add Project</button>
        </>
      )}
    </div>
  );
}

describe('ProjectContext Integration', () => {
  it('debe iniciar sin proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );

    expect(screen.getByText('No project')).toBeInTheDocument();
  });

  it('debe agregar un proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );

    // Click en agregar
    fireEvent.click(screen.getByText('Add Project'));

    // Verificamos que el proyecto se agregó
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
  });

  it('debe remover el proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );

    // Agregamos proyecto
    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByText('Test Project')).toBeInTheDocument();

    // Removemos proyecto
    fireEvent.click(screen.getByText('Remove Project'));
    expect(screen.getByText('No project')).toBeInTheDocument();
  });
});
