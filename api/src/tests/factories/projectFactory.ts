// Tipo para proyectos en los tests (sin extender Document de Mongoose)
type ProjectInput = {
  _id?: string;
  title: string;
  description: string;
  version: string;
  link: string;
  tag: string;
  timestamp: number;
};

// ==================== CONTADOR GLOBAL ====================

let projectId = 1;

export function resetProjectFactory() {
  projectId = 1;
}

// ==================== FACTORY BÁSICO ====================

/**
 * Construye un proyecto con valores por defecto razonables.
 * Cada llamada genera un proyecto único.
 */
export function buildProject(attrs: Partial<ProjectInput> = {}): ProjectInput {
  const id = `project-${projectId++}`;

  return {
    _id: id,
    title: attrs.title || `Project ${projectId}`,
    description: attrs.description || `Description for project ${projectId}`,
    version: attrs.version || '1.0.0',
    link: attrs.link || `https://github.com/user/${id}`,
    tag: attrs.tag || 'general',
    timestamp: attrs.timestamp || Date.now(),
    ...attrs,
  };
}

// ==================== HELPERS DE BULK ====================

/**
 * Crea N proyectos de forma eficiente.
 */
export function buildProjects(count: number, attrs: Partial<ProjectInput> = {}): ProjectInput[] {
  return Array.from({ length: count }, () => buildProject(attrs));
}

/**
 * Crea proyectos con tags específicos.
 */
export function buildEducationProjects(count: number): ProjectInput[] {
  return buildProjects(count, { tag: 'education' });
}

export function buildReactProjects(count: number): ProjectInput[] {
  return buildProjects(count, { tag: 'react' });
}

// ==================== FACTORIES CON ESTADOS ESPECÍFICOS ====================

/**
 * Crea un proyecto "completo" con todos los campos llenos.
 */
export function buildCompleteProject(): ProjectInput {
  return buildProject({
    title: 'Complete Project',
    description: 'A fully detailed project with all fields',
    version: '2.5.3',
    link: 'https://github.com/complete/project',
    tag: 'featured',
  });
}

/**
 * Crea un proyecto reciente (timestamp muy actual).
 */
export function buildRecentProject(): ProjectInput {
  return buildProject({
    timestamp: Date.now(),
  });
}

/**
 * Crea un proyecto antiguo (timestamp de hace meses).
 */
export function buildOldProject(): ProjectInput {
  return buildProject({
    timestamp: Date.now() - 7776000000, // 90 días atrás
  });
}