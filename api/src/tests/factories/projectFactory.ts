import { IProjectsModel } from '@/components/Projects/model';
import { validProject } from '../fixtures/projects';

// Solo los campos de entrada usados por el esquema (sin _id)
type ProjectInput = Pick<IProjectsModel, 'title' | 'description' | 'version' | 'link' | 'tag' | 'timestamp'>;

let counter = 1;

/**
 * Factory: construye un proyecto único
 */
export function buildProject(overrides: Partial<ProjectInput> = {}): ProjectInput {
  const n = counter++;

  return {
    ...validProject,
    title: `${validProject.title} #${n}`,
    link: `${validProject.link}?n=${n}`,
    timestamp: Date.now() + n,
    ...overrides
  };
}

/**
 * Factory: construye N proyectos
 */
export function buildProjects(count: number): ProjectInput[] {
  return Array.from({ length: count }, () => buildProject());
}

/**
 * Factory: reinicia el contador (útil entre tests)
 */
export function resetProjectFactory() {
  counter = 1;
}
