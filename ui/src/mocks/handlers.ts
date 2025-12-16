import { http, HttpResponse } from 'msw';
import { Project } from '../model/project';
import { AboutMe } from '../model/aboutme';

// ==================== DATOS MOCK ====================

const mockAboutMe: AboutMe = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Lucas Fernandez',
  birthday: 631152000000, // 1990-01-01
  nationality: 'Spanish',
  job: 'Software Developer',
  github: 'https://github.com/lucferbux'
};

const mockProjects: Project[] = [
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Taller Testing & Security',
    description: 'Proyecto educativo sobre testing y seguridad en aplicaciones web',
    version: '1.0.0',
    link: 'https://github.com/lucferbux/Taller-Testing-Security',
    tag: 'education',
    timestamp: Date.now()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'React Dashboard',
    description: 'Dashboard administrativo con React y TypeScript',
    version: '2.1.0',
    link: 'https://github.com/lucferbux/react-dashboard',
    tag: 'react',
    timestamp: Date.now() - 86400000
  }
];

// ==================== HANDLERS ====================

export const handlers = [
  
  // POST /auth/login - Autenticación
  // NOTA: El cliente HttpApiClient usa URLSearchParams, no FormData
  http.post('/auth/login', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const email = params.get('email');
    const password = params.get('password');
    
    // Simulamos validación de credenciales
    if (email === 'user@test.com' && password === 'password123') {
      return HttpResponse.json({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token'
      });
    }
    
    // Credenciales inválidas
    return new HttpResponse(null, { status: 401 });
  }),
  
  // GET /v1/aboutme/ - Obtener información del perfil
  http.get('/v1/aboutme/', () => {
    return HttpResponse.json(mockAboutMe);
  }),
  
  // GET /v1/projects/ - Listar todos los proyectos
  http.get('/v1/projects/', () => {
    return HttpResponse.json(mockProjects);
  }),
  
  // POST /v1/projects - Crear nuevo proyecto
  http.post('/v1/projects', async ({ request }) => {
    const newProject = await request.json() as Project;
    
    // Verificamos que el token esté presente
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Simulamos la creación (agregamos _id y timestamp)
    const createdProject: Project = {
      ...newProject,
      _id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    return HttpResponse.json(createdProject);
  }),
  
  // PUT /v1/projects - Actualizar proyecto existente
  http.put('/v1/projects', async ({ request }) => {
    const updatedProject = await request.json() as Project;
    
    // Verificamos autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Verificamos que el proyecto exista
    if (!updatedProject._id) {
      return new HttpResponse(null, { status: 400 });
    }
    
    // Retornamos el proyecto actualizado
    return HttpResponse.json({
      ...updatedProject,
      timestamp: Date.now()
    });
  }),
  
  // DELETE /v1/projects - Eliminar proyecto
  http.delete('/v1/projects', async ({ request }) => {
    const body = await request.json() as { id: string };
    
    // Verificamos autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Verificamos que el ID esté presente
    if (!body.id) {
      return new HttpResponse(null, { status: 400 });
    }
    
    // Confirmamos eliminación
    return HttpResponse.json({ 
      message: 'Project deleted successfully',
      id: body.id 
    });
  }),
];