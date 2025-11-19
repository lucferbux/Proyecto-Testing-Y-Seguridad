import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';
import { GenericError } from '../../api/api-client';

describe('useFetchData', () => {
  it('debe cargar datos exitosamente', async () => {
    // Mock de función fetch que retorna datos
    const mockFetch = jest.fn().mockResolvedValue({
      id: 1,
      title: 'Test Project'
    });

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

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
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('debe manejar errores de fetch', async () => {
    // Mock que falla
    const mockError = new Error('Network error');
    const mockFetch = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar estado de error
    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('debe manejar GenericError de la API', async () => {
    const genericError = new GenericError('API error', 500);
    const mockFetch = jest.fn().mockRejectedValue(genericError);

    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(genericError);
  });

  it('debe permitir recargar datos con reload()', async () => {
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
});