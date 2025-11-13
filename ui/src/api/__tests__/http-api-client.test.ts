import HttpApiClient from '../http-api-client';
import { getAccessToken, removeAuthToken } from '../../utils/auth';
import { Project } from '../../model/project';

// Mock de las funciones de auth
jest.mock('../../utils/auth');
const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockRemoveAuthToken = removeAuthToken as jest.MockedFunction<typeof removeAuthToken>;

describe('HttpApiClient', () => {
  let client: HttpApiClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Limpiar localStorage
    localStorage.clear();

    // Mock de fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Limpiar mocks
    jest.clearAllMocks();

    // Crear nueva instancia del cliente con URL de prueba
    client = new HttpApiClient('http://localhost:3000/api');
  });

  describe('token', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.token('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
        })
      );

      // Verificar que el body contiene email y password
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('email')).toBe('test@example.com');
      expect(body.get('password')).toBe('password123');

      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar error 401 para credenciales incorrectas', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue('Unauthorized'),
      } as any);

      await expect(client.token('wrong@example.com', 'wrongpass')).rejects.toMatchObject({});
    });

    it('debe lanzar error 400 para datos inválidos', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue('Bad Request'),
      } as any);

      await expect(client.token('invalid-email', '')).rejects.toMatchObject({});
    });
  });

  describe('getProjects', () => {
    const mockProjects: Project[] = [
      {
        _id: '1',
        title: 'Project 1',
        description: 'Description 1',
        version: '1.0.0',
        link: 'https://github.com/test/project1',
        tag: 'React',
        timestamp: Date.now(),
      },
      {
        _id: '2',
        title: 'Project 2',
        description: 'Description 2',
        version: '2.0.0',
        link: 'https://github.com/test/project2',
        tag: 'TypeScript',
        timestamp: Date.now(),
      },
    ];

    it('debe obtener proyectos exitosamente', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProjects,
      });

      const result = await client.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects/',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío cuando no hay proyectos', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const result = await client.getProjects();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('debe lanzar error 404 si no se encuentra el endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue('Not Found'),
      } as any);

      await expect(client.getProjects()).rejects.toMatchObject({});
    });

    it('debe redirigir a login si hay error 401 (no autorizado)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue('Unauthorized'),
      } as any);

      await expect(client.getProjects()).rejects.toMatchObject({});

      // Verificar que se llamó removeAuthToken
      // Nota: No podemos testear window.location.replace porque es read-only en jsdom
      expect(mockRemoveAuthToken).toHaveBeenCalled();
    });

    it('debe manejar errores de red', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.getProjects()).rejects.toThrow('Network error');
    });
  });

  describe('postProject', () => {
    const newProject: Project = {
      title: 'New Project',
      description: 'New Description',
      version: '1.0.0',
      link: 'https://github.com/test/new-project',
      tag: 'React,TypeScript',
      timestamp: Date.now(),
    };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe crear un proyecto exitosamente', async () => {
      const mockResponse = { ...newProject, _id: 'new-id-123' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await client.postProject(newProject);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newProject),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar error si no hay token de autenticación', async () => {
      mockGetAccessToken.mockImplementation(() => {
        throw Object.assign(new Error('Unauthorized'), { code: 402 });
      });

      await expect(client.postProject(newProject)).rejects.toThrow('Unauthorized');
    });

    it('debe manejar error 422 (Unprocessable Entity)', async () => {
      mockGetAccessToken.mockReturnValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: jest.fn().mockResolvedValue({ detail: 'Invalid project data' }),
        text: jest.fn().mockResolvedValue('Unprocessable Entity'),
      } as any);

      await expect(client.postProject(newProject)).rejects.toMatchObject({});
    });
  });

  describe('updateProject', () => {
    const existingProject: Project = {
      _id: 'existing-id',
      title: 'Updated Project',
      description: 'Updated Description',
      version: '2.0.0',
      link: 'https://github.com/test/updated',
      tag: 'React',
      timestamp: Date.now(),
    };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe actualizar un proyecto exitosamente', async () => {
      const mockResponse = { ...existingProject };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.updateProject(existingProject);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
          body: JSON.stringify(existingProject),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe eliminar un proyecto exitosamente', async () => {
      const projectId = 'project-to-delete';
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.deleteProject(projectId);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
          body: JSON.stringify({ id: projectId }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar error 404 si el proyecto no existe', async () => {
      mockGetAccessToken.mockReturnValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue('Not Found'),
      } as any);

      await expect(client.deleteProject('non-existent-id')).rejects.toMatchObject({});
    });
  });

  describe('createOrUpdateProject', () => {
    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe crear proyecto si no tiene _id', async () => {
      const newProject: Project = {
        title: 'New Project',
        description: 'Description',
        version: '1.0.0',
        link: 'https://github.com/test',
        tag: 'React',
        timestamp: Date.now(),
      };

      const mockResponse = { ...newProject, _id: 'new-id' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      await client.createOrUpdateProject(newProject);

      // Verificar que se llamó POST
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('debe actualizar proyecto si tiene _id', async () => {
      const existingProject: Project = {
        _id: 'existing-id',
        title: 'Existing Project',
        description: 'Description',
        version: '1.0.0',
        link: 'https://github.com/test',
        tag: 'TypeScript',
        timestamp: Date.now(),
      };

      const mockResponse = { ...existingProject };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await client.createOrUpdateProject(existingProject);

      // Verificar que se llamó PUT
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('getDashboardInfo', () => {
    it('debe obtener aboutMe y projects en paralelo', async () => {
      const mockAboutMe = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockProjects: Project[] = [
        {
          _id: '1',
          title: 'Project 1',
          description: 'Description',
          version: '1.0.0',
          link: 'https://github.com/test',
          tag: 'React',
          timestamp: Date.now(),
        },
      ];

      // Configurar fetch para retornar diferentes respuestas según la URL
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/aboutme/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockAboutMe,
          });
        }
        if (url.includes('/projects/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockProjects,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await client.getDashboardInfo();

      expect(result).toEqual({
        aboutMe: mockAboutMe,
        projects: mockProjects,
      });

      // Verificar que se hicieron ambas llamadas
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/aboutme/'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/'),
        expect.any(Object)
      );
    });
  });
});
