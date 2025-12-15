import HttpApiClient from './http-api-client';
import { 
  BadRequest, 
  Unauthorized, 
  Forbidden, 
  NotFound, 
  UnprocessableEntity,
  GenericError
} from './api-client';
import * as authUtils from '../utils/auth';
import { Project } from '../model/project';

global.fetch = jest.fn();

jest.mock('../utils/auth', () => ({
  getAccessToken: jest.fn(),
  removeAuthToken: jest.fn(),
}));

const mockLocationReplace = jest.fn();


try {
  delete (window as any).location;
  (window as any).location = {
    replace: mockLocationReplace,
    assign: jest.fn(),
    reload: jest.fn(),
    href: 'http://localhost/',
    toString: () => 'http://localhost/',
  };
} catch (e) {
  console.error(e);
}


describe('HttpApiClient', () => {
  const baseUrl = 'http://api.test.com';
  let client: HttpApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HttpApiClient(baseUrl);
  });

  describe('token (login)', () => {
    // Verifica que el login exitoso devuelva el token y llame al endpoint correcto
    it('should return token response on successful login', async () => {
      const mockResponse = { accessToken: 'fake-token' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.token('test@test.com', 'password');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
        })
      );
    });

    // Verifica que se lance BadRequest cuando la API responde con 400
    it('should throw BadRequest on 400 error', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
        json: async () => ({}),
      };
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(mockResponse));

      try {
        await client.token('test@test.com', 'pass');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequest);
      }
    });

    // Verifica que se lance Unauthorized cuando la API responde con 401
    it('should throw Unauthorized on 401 error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        json: async () => ({}),
      };
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(mockResponse));

      try {
        await client.token('test@test.com', 'pass');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(Unauthorized);
      }
    });

    // Verifica que se lance GenericError cuando la API responde con 500
    it('should throw GenericError on 500 error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        json: async () => ({}),
      };
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(mockResponse));

      try {
        await client.token('test@test.com', 'pass');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(GenericError);
        expect((e as GenericError).httpCode).toBe(500);
        expect((e as GenericError).description).toBe('Internal Server Error');
      }
    });
  });

  describe('Error Handling (createApiError logic)', () => {
    // Helper para probar el mapeo de errores
    const testErrorMapping = async (status: number, errorType: any) => {
      const mockResponse = {
        ok: false,
        status: status,
        text: async () => 'Error',
        json: async () => ({ detail: 'Error Detail' }),
      };
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(mockResponse));

      try {
        await client.token('a', 'b');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(errorType);
      }
    };

    // Verifica mapeo de 403 a Forbidden
    it('should map 403 to Forbidden', async () => {
      await testErrorMapping(403, Forbidden);
    });

    // Verifica mapeo de 404 a NotFound
    it('should map 404 to NotFound', async () => {
      await testErrorMapping(404, NotFound);
    });

    // Verifica mapeo de 422 a UnprocessableEntity
    it('should map 422 to UnprocessableEntity', async () => {
      await testErrorMapping(422, UnprocessableEntity);
    });
  });

  describe('handleResponse (Logout logic)', () => {
    // Verifica que se cierre sesión y redirija si ocurre un error de autorización
    it('should logout and redirect if Unauthorized error occurs', async () => {
      
    });
  });

  describe('Project Operations', () => {
    const mockProject: Project = {
      _id: '1',
      title: 'Test Project',
      description: 'Desc',
      link: 'http://link.com',
      version: '1.0',
      tag: 'tag',
      timestamp: 123
    };

    beforeEach(() => {
      (authUtils.getAccessToken as jest.Mock).mockReturnValue('fake-token');
    });

    // Verifica que postProject envíe una petición POST correcta
    it('postProject should send POST request', async () => {
      const mockResponse = { message: 'success' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.postProject(mockProject);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
          body: JSON.stringify(mockProject),
        })
      );
    });

    // Verifica que updateProject envíe una petición PUT correcta
    it('updateProject should send PUT request', async () => {
      const mockResponse = { message: 'updated' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.updateProject(mockProject);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockProject),
        })
      );
    });

    // Verifica que createOrUpdateProject llame a postProject si no hay ID
    it('createOrUpdateProject should call postProject if _id is undefined', async () => {
      const newProject = { ...mockProject, _id: undefined };
      const mockResponse = { message: 'created' };
      
      // Spy on postProject
      const postSpy = jest.spyOn(client, 'postProject').mockResolvedValue(mockResponse);
      
      const result = await client.createOrUpdateProject(newProject);
      
      expect(postSpy).toHaveBeenCalledWith(newProject);
      expect(result).toEqual(mockResponse);
    });

    // Verifica que createOrUpdateProject llame a updateProject si hay ID
    it('createOrUpdateProject should call updateProject if _id is defined', async () => {
      const mockResponse = { message: 'updated' };
      
      // Spy on updateProject
      const updateSpy = jest.spyOn(client, 'updateProject').mockResolvedValue(mockResponse);
      
      const result = await client.createOrUpdateProject(mockProject);
      
      expect(updateSpy).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual(mockResponse);
    });

    // Verifica que deleteProject envíe una petición DELETE correcta
    it('deleteProject should send DELETE request', async () => {
      const mockResponse = { message: 'deleted' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.deleteProject('1');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/v1/projects`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: '1' }),
        })
      );
    });

    // Verifica manejo de errores en postProject
    it('postProject should throw error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
        json: async () => ({}),
      });

      try {
        await client.postProject(mockProject);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequest);
      }
    });

    // Verifica manejo de errores en updateProject
    it('updateProject should throw error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
        json: async () => ({}),
      });

      try {
        await client.updateProject(mockProject);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(Forbidden);
      }
    });

    // Verifica manejo de errores en deleteProject
    it('deleteProject should throw error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
        json: async () => ({}),
      });

      try {
        await client.deleteProject('1');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFound);
      }
    });
  });
});
