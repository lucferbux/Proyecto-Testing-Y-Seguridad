import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import { Project } from '../../model/project';
import createApiClient from '../../api/api-client-factory';

const apiClient = createApiClient();

/**
 * Componente que muestra una lista de proyectos obtenidos de la API.
 * Maneja estados de carga, error y lista vacía.
 */
export function ProjectList() {
  const { data: projects, isLoading, error } = useFetchData<Project[]>(
    () => apiClient.getProjects()
  );

  if (isLoading) return <div>Cargando proyectos...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!projects || projects.length === 0) return <div>No hay proyectos disponibles</div>;

  return (
    <ul role="list">
      {projects.map(project => (
        <li key={project._id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          {project.version && <span>v{project.version}</span>}
          {project.tag && <span className="tag">{project.tag}</span>}
        </li>
      ))}
    </ul>
  );
}

export default ProjectList;
