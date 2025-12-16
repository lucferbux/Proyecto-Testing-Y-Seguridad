import HttpApiClient from '../http-api-client';
import {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  UnprocessableEntity,
  GenericError
} from '../api-client';
import { Project } from '../../model/project';

// Mock de getAccessToken y removeAuthToken
const mockGetAccessToken = jest.fn();
const mockRemoveAuthToken = jest.fn();
jest.mock('../../utils/auth', () => ({
  getAccessToken: () => mockGetAccessToken(),
  removeAuthToken: () => mockRemoveAuthToken()
}));

// Mock global de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HttpApiClient', () => {
  let client: HttpApiClient;
  const baseUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HttpApiClient(baseUrl);
    mockGetAccessToken.mockReturnValue('mock-access-token');
  });

  // ============================================
  // Constructor Tests
  // ============================================
  describe('Constructor', () => {
    it('debe inicializar con baseUrl correcta', () => {
      const testUrl = 'https://api.example.com';
      const testClient = new HttpApiClient(testUrl);
      expect(testClient.baseUrl).toBe(testUrl);
    });
  });

  // ============================================
  // token() Tests - Login
  // ============================================
  describe('token()', () => {
    it('debe hacer login exitoso y retornar TokenResponse', async () => {
      const mockTokenResponse = { token: 'jwt-token-123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });

      const result = await client.token('user@test.com', 'password123');

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/auth/login`,
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('debe lanzar BadRequest en error 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(client.token('user@test.com', 'bad')).rejects.toBeInstanceOf(BadRequest);
    });

    it('debe lanzar Unauthorized en error 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(client.token('user@test.com', 'wrong')).rejects.toBeInstanceOf(Unauthorized);
    });

    it('debe lanzar Forbidden en error 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      await expect(client.token('user@test.com', 'forbidden')).rejects.toBeInstanceOf(Forbidden);
    });
  });

  // ============================================
  // getProjects() Tests
  // ============================================
  describe('getProjects()', () => {
    it('debe retornar array de proyectos exitosamente', async () => {
      const mockProjects: Project[] = [
        {
          _id: '1',
          title: 'Project 1',
          description: 'Desc 1',
          version: 'v1.0',
          link: 'http://example.com',
          tag: 'React',
          timestamp: Date.now()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      });

      const result = await client.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects/`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('debe lanzar NotFound en error 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(client.getProjects()).rejects.toBeInstanceOf(NotFound);
    });

    it('debe remover token en error 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(client.getProjects()).rejects.toBeInstanceOf(Unauthorized);
      expect(mockRemoveAuthToken).toHaveBeenCalled();
    });
  });

  // ============================================
  // getAboutMe() Tests
  // ============================================
  describe('getAboutMe()', () => {
    it('debe retornar información AboutMe exitosamente', async () => {
      const mockAboutMe = { name: 'Test User', bio: 'Developer' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAboutMe
      });

      const result = await client.getAboutMe();
      expect(result).toEqual(mockAboutMe);
    });
  });

  // ============================================
  // postProject() Tests
  // ============================================
  describe('postProject()', () => {
    const newProject: Project = {
      title: 'New Project',
      description: 'New Description',
      version: 'v1.0.0',
      link: 'http://new-project.com',
      tag: 'TypeScript',
      timestamp: Date.now()
    };

    it('debe crear proyecto exitosamente', async () => {
      const mockResponse = { message: 'Project created' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.postProject(newProject);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token'
          })
        })
      );
    });

    it('debe lanzar UnprocessableEntity en error 422', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Validation error' })
      });

      await expect(client.postProject(newProject)).rejects.toBeInstanceOf(UnprocessableEntity);
    });
  });

  // ============================================
  // deleteProject() Tests
  // ============================================
  describe('deleteProject()', () => {
    it('debe eliminar proyecto exitosamente', async () => {
      const mockResponse = { message: 'Project deleted' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.deleteProject('project-123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: 'project-123' })
        })
      );
    });
  });

  // ============================================
  // createOrUpdateProject() Tests
  // ============================================
  describe('createOrUpdateProject()', () => {
    it('debe llamar a postProject cuando proyecto no tiene _id', async () => {
      const newProject: Project = {
        title: 'New',
        description: 'New',
        version: 'v1',
        link: 'http://test.com',
        tag: 'Test',
        timestamp: Date.now()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Created' })
      });

      await client.createOrUpdateProject(newProject);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('debe llamar a updateProject cuando proyecto tiene _id', async () => {
      const existingProject: Project = {
        _id: 'existing-id',
        title: 'Existing',
        description: 'Existing',
        version: 'v2',
        link: 'http://existing.com',
        tag: 'Existing',
        timestamp: Date.now()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Updated' })
      });

      await client.createOrUpdateProject(existingProject);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('debe crear GenericError para códigos no manejados', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(client.token('test@test.com', 'pass')).rejects.toBeInstanceOf(GenericError);
    });
  });
});
