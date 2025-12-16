import { IProjectsModel } from '@/components/Projects/model';

// ==================== DATOS BÁSICOS ====================

// Tipo para datos de entrada de proyectos (solo los campos del schema)
type ProjectInput = Pick<IProjectsModel, 'title' | 'description' | 'version' | 'link' | 'tag' | 'timestamp'>;

// Proyecto válido estándar
export const validProject: ProjectInput = {
  title: 'Taller Testing & Security',
  description: 'Proyecto educativo sobre testing y seguridad en aplicaciones web',
  version: '1.0.0',
  link: 'https://github.com/lucferbux/Taller-Testing-Security',
  tag: 'education',
  timestamp: Date.now()
};

// Casos de proyectos inválidos - para testear validaciones
export const invalidProjects = {
  noTitle: {
    description: 'Missing title',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now()
  } as Partial<ProjectInput>,

  noDescription: {
    title: 'No Description Project',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now()
  } as Partial<ProjectInput>,

  invalidLink: {
    title: 'Invalid Link',
    description: 'Project with invalid link',
    version: '1.0.0',
    link: 'not-a-url',
    tag: 'test',
    timestamp: Date.now()
  } as Partial<ProjectInput>
};

// ==================== COLECCIONES ====================

// Conjunto de proyectos de muestra
export const sampleProjects: ProjectInput[] = [
  {
    title: 'React Dashboard',
    description: 'Dashboard administrativo con React y TypeScript',
    version: '2.1.0',
    link: 'https://github.com/lucferbux/react-dashboard',
    tag: 'react',
    timestamp: Date.now()
  },
  {
    title: 'Vue Portfolio',
    description: 'Portfolio personal construido con Vue.js',
    version: '1.5.2',
    link: 'https://github.com/lucferbux/vue-portfolio',
    tag: 'vue',
    timestamp: Date.now() - 86400000 // 1 día atrás
  },
  {
    title: 'Node API',
    description: 'RESTful API con Node.js y Express',
    version: '3.0.0',
    link: 'https://github.com/lucferbux/node-api',
    tag: 'backend',
    timestamp: Date.now() - 172800000 // 2 días atrás
  }
];

// Proyectos por categoría
export const educationProjects = sampleProjects.filter((p) => p.tag === 'education');
export const reactProjects = sampleProjects.filter((p) => p.tag === 'react');