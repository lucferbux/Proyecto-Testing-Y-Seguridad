import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';
import { GenericError } from '../../api/api-client';

describe('useFetchData', () => {
  // ==================== Estado Inicial ====================
  describe('Estado inicial', () => {
    it('data debe tener el valor inicial proporcionado', () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });
      const initialValue = { id: 0, name: 'Initial' };

      const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

      // El data debe comenzar con el valor inicial
      expect(result.current.data).toEqual(initialValue);
    });

    it('loading debe ser true en el primer render', () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFetchData(mockFetch));

      expect(result.current.isLoading).toBe(true);
    });

    it('error debe ser null inicialmente', () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFetchData(mockFetch));

      expect(result.current.error).toBeNull();
    });

    it('data debe ser null si no se proporciona valor inicial', () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFetchData(mockFetch));

      expect(result.current.data).toBeNull();
    });
  });

  // ==================== Fetch Exitoso ====================
  describe('Fetch exitoso', () => {
    it('debe cargar datos exitosamente', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        id: 1,
        title: 'Test Project'
      });

      const { result } = renderHook(() => useFetchData(mockFetch));

      // Estado inicial: loading
      expect(result.current.isLoading).toBe(true);

      // Esperar a que termine el fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verificar datos cargados
      expect(result.current.data).toEqual({
        id: 1,
        title: 'Test Project'
      });
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('loading debe cambiar a false despues del fetch', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('data debe contener los datos retornados', async () => {
      const expectedData = { id: 1, name: 'Test', items: [1, 2, 3] };
      const mockFetch = jest.fn().mockResolvedValue(expectedData);

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(expectedData);
    });

    it('error debe ser null en fetch exitoso', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==================== Fetch con Error ====================
  describe('Fetch con error', () => {
    it('debe manejar errores de fetch', async () => {
      const mockError = new Error('Network error');
      const mockFetch = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('loading debe cambiar a false despues del error', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('error debe contener el mensaje de error', async () => {
      const errorMessage = 'Connection timeout';
      const mockFetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect((result.current.error as Error)?.message).toBe(errorMessage);
    });

    it('data debe mantener el valor inicial cuando hay error', async () => {
      const initialValue = { id: 0, name: 'Initial' };
      const mockFetch = jest.fn().mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(initialValue);
    });

    it('debe manejar GenericError de la API', async () => {
      const genericError = new GenericError(500, 'API error');
      const mockFetch = jest.fn().mockRejectedValue(genericError);

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(genericError);
    });
  });

  // ==================== Refetch ====================
  describe('Refetch', () => {
    it('debe volver a hacer fetch cuando se llama reload()', async () => {
      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(async () => {
        callCount++;
        return { id: callCount, title: `Project ${callCount}` };
      });

      const { result } = renderHook(() => useFetchData(mockFetch));

      // Primera carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, title: 'Project 1' });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Recargar
      act(() => {
        result.current.reload();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2, title: 'Project 2' });
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('loading debe ser true durante el refetch', async () => {
      const mockFetch = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 100))
      );

      const { result } = renderHook(() => useFetchData(mockFetch));

      // Esperar primera carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Iniciar refetch
      act(() => {
        result.current.reload();
      });

      // Debe estar en loading durante el refetch
      expect(result.current.isLoading).toBe(true);

      // Esperar a que termine
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('error debe limpiarse en cada refetch', async () => {
      let shouldFail = true;
      const mockFetch = jest.fn().mockImplementation(async () => {
        if (shouldFail) {
          throw new Error('First call error');
        }
        return { id: 1 };
      });

      const { result } = renderHook(() => useFetchData(mockFetch));

      // Primera carga falla
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.error).not.toBeNull();

      // Cambiar a exito y recargar
      shouldFail = false;
      act(() => {
        result.current.reload();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Error debe estar limpio
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge cases', () => {
    it('no debe setear error si el rechazo no es Error ni GenericError', async () => {
      // Este test cubre la linea 28 del hook donde se verifica instanceof
      const mockFetch = jest.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Error debe seguir siendo null porque 'string error' no es instanceof Error
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it('no debe setear error si el rechazo es un numero', async () => {
      const mockFetch = jest.fn().mockRejectedValue(404);

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('no debe setear error si el rechazo es un objeto plano', async () => {
      const mockFetch = jest.fn().mockRejectedValue({ code: 500, msg: 'error' });

      const { result } = renderHook(() => useFetchData(mockFetch));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });
});