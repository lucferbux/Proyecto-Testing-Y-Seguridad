import HttpApiClient from '../http-api-client';
import {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  UnprocessableEntity,
  PreconditionFailed,
  PreconditionRequired,
  GenericError,
} from '../api-client';
import { getAccessToken, removeAuthToken } from '../../utils/auth';
import { Project } from '../../model/project';
import { AboutMe } from '../../model/aboutme';

// Mock de las utilidades de autenticación
jest.mock('../../utils/auth', () => ({
  getAccessToken: jest.fn(),
  removeAuthToken: jest.fn(),
}));

const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockRemoveAuthToken = removeAuthToken as jest.MockedFunction<typeof removeAuthToken>;

describe('HttpApiClient', () => {
  let client: HttpApiClient;
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    client = new HttpApiClient(baseUrl);
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debe crear una instancia con la baseUrl correcta', () => {
      expect(client.baseUrl).toBe(baseUrl);
    });
  });

  describe('token', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = { token: 'test-token-123' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.token('test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/auth/login`, {
        method: 'POST',
        body: expect.any(URLSearchParams),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar BadRequest (400) en credenciales inválidas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      await expect(client.token('wrong@example.com', 'wrongpass')).rejects.toBeInstanceOf(BadRequest);
    });

    it('debe lanzar Unauthorized (401) cuando no está autorizado', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(client.token('test@example.com', 'password')).rejects.toBeInstanceOf(Unauthorized);
    });
  });

  describe('getAboutMe', () => {
    const mockAboutMe: AboutMe = {
      _id: '1',
      name: 'John Doe',
      birthday: 631152000000,
      nationality: 'Spanish',
      job: 'Developer',
      github: 'https://github.com/johndoe',
    };

    it('debe obtener información de AboutMe exitosamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAboutMe,
      });

      const result = await client.getAboutMe();

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/v1/aboutme/`, {
        method: 'GET',
        headers: {},
      });
      expect(result).toEqual(mockAboutMe);
    });

    it('debe lanzar NotFound (404) cuando no existe', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(client.getAboutMe()).rejects.toBeInstanceOf(NotFound);
    });

    it('debe manejar errores Unauthorized (401) y redirigir', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(client.getAboutMe()).rejects.toBeInstanceOf(Unauthorized);
      expect(mockRemoveAuthToken).toHaveBeenCalled();
    });
  });

  describe('getProjects', () => {
    const mockProjects: Project[] = [
      {
        _id: '1',
        title: 'Project 1',
        description: 'Description 1',
        link: 'https://example.com',
        version: 'v1.0',
        tag: 'React',
        timestamp: Date.now(),
      },
      {
        _id: '2',
        title: 'Project 2',
        description: 'Description 2',
        link: 'https://example2.com',
        version: 'v2.0',
        tag: 'Node',
        timestamp: Date.now(),
      },
    ];

    it('debe obtener lista de proyectos exitosamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProjects,
      });

      const result = await client.getProjects();

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/v1/projects/`, {
        method: 'GET',
        headers: {},
      });
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío cuando no hay proyectos', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const result = await client.getProjects();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('debe lanzar error en caso de fallo', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(client.getProjects()).rejects.toBeInstanceOf(GenericError);
    });

    it('debe cerrar sesión y redirigir en Unauthorized (401)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(client.getProjects()).rejects.toBeInstanceOf(Unauthorized);
      expect(mockRemoveAuthToken).toHaveBeenCalled();
    });
  });

  describe('getDashboardInfo', () => {
    const mockAboutMe: AboutMe = {
      _id: '1',
      name: 'John Doe',
    };

    const mockProjects: Project[] = [
      {
        _id: '1',
        title: 'Project 1',
        description: 'Description 1',
        link: 'https://example.com',
        version: 'v1.0',
        tag: 'React',
        timestamp: Date.now(),
      },
    ];

    it('debe obtener información del dashboard (aboutMe + projects)', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAboutMe,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProjects,
        });

      const result = await client.getDashboardInfo();

      expect(result).toEqual({
        aboutMe: mockAboutMe,
        projects: mockProjects,
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('postProject', () => {
    const newProject: Project = {
      title: 'New Project',
      description: 'New Description',
      link: 'https://newproject.com',
      version: 'v1.0',
      tag: 'Vue',
      timestamp: Date.now(),
    };

    const mockResponse = { message: 'Project created successfully' };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe crear un proyecto exitosamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.postProject(newProject);

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/v1/projects`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar UnprocessableEntity (422) con detalle', async () => {
      const errorDetail = 'Invalid project data';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: errorDetail }),
        text: async () => errorDetail,
      });

      await expect(client.postProject(newProject)).rejects.toBeInstanceOf(UnprocessableEntity);
    });

    it('debe lanzar Forbidden (403) cuando no tiene permisos', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(client.postProject(newProject)).rejects.toBeInstanceOf(Forbidden);
    });

    it('debe lanzar error cuando no hay token', async () => {
      mockGetAccessToken.mockReturnValue('');

      await expect(client.postProject(newProject)).rejects.toThrow();
    });
  });

  describe('updateProject', () => {
    const existingProject: Project = {
      _id: '123',
      title: 'Updated Project',
      description: 'Updated Description',
      link: 'https://updated.com',
      version: 'v2.0',
      tag: 'Angular',
      timestamp: Date.now(),
    };

    const mockResponse = { message: 'Project updated successfully' };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe actualizar un proyecto exitosamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.updateProject(existingProject);

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/v1/projects`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(existingProject),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar NotFound (404) cuando el proyecto no existe', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(client.updateProject(existingProject)).rejects.toBeInstanceOf(NotFound);
    });

    it('debe lanzar PreconditionFailed (412)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 412,
        json: async () => ({}),
      });

      await expect(client.updateProject(existingProject)).rejects.toBeInstanceOf(PreconditionFailed);
    });
  });

  describe('createOrUpdateProject', () => {
    const newProject: Project = {
      title: 'Project without ID',
      description: 'Description',
      link: 'https://example.com',
      version: 'v1.0',
      tag: 'React',
      timestamp: Date.now(),
    };

    const existingProject: Project = {
      _id: '456',
      title: 'Project with ID',
      description: 'Description',
      link: 'https://example.com',
      version: 'v1.0',
      tag: 'React',
      timestamp: Date.now(),
    };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe llamar a postProject cuando el proyecto no tiene _id', async () => {
      const mockResponse = { message: 'Project created' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createOrUpdateProject(newProject);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('debe llamar a updateProject cuando el proyecto tiene _id', async () => {
      const mockResponse = { message: 'Project updated' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createOrUpdateProject(existingProject);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProject', () => {
    const projectId = '789';
    const mockResponse = { message: 'Project deleted successfully' };

    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe eliminar un proyecto exitosamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.deleteProject(projectId);

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/v1/projects`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-token',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: projectId }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar NotFound (404) cuando el proyecto no existe', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(client.deleteProject(projectId)).rejects.toBeInstanceOf(NotFound);
    });

    it('debe lanzar Unauthorized (401) sin token válido', async () => {
      mockGetAccessToken.mockReturnValue('');

      await expect(client.deleteProject(projectId)).rejects.toThrow();
    });

    it('debe lanzar PreconditionRequired (428)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 428,
        json: async () => ({}),
      });

      await expect(client.deleteProject(projectId)).rejects.toBeInstanceOf(PreconditionRequired);
    });
  });

  describe('Manejo de errores HTTP', () => {
    beforeEach(() => {
      mockGetAccessToken.mockReturnValue('valid-token');
    });

    it('debe lanzar GenericError para códigos de error no manejados', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
        json: async () => ({}),
      });

      await expect(client.getProjects()).rejects.toBeInstanceOf(GenericError);
    });

    it('debe lanzar UnprocessableEntity (415)', async () => {
      const project: Project = {
        title: 'Test',
        description: 'Test',
        link: 'https://test.com',
        version: 'v1.0',
        tag: 'Test',
        timestamp: Date.now(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 415,
        json: async () => ({ detail: 'Unsupported Media Type' }),
        text: async () => 'Unsupported Media Type',
      });

      await expect(client.postProject(project)).rejects.toBeInstanceOf(UnprocessableEntity);
    });
  });
});