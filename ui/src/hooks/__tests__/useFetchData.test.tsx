import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';

describe('useFetchData', () => {
  it('debe tener el estado inicial correcto', async () => {
    const mockFetch = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves to check loading state
    const { result } = renderHook(() => useFetchData(mockFetch));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar un fetch exitoso', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetch = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Inicialmente cargando
    expect(result.current.isLoading).toBe(true);

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar un error en el fetch', async () => {
    const mockError = new Error('Error fetching data');
    const mockFetch = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
  });

  it('debe permitir hacer refetch (reload)', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetch = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Ejecutar reload
    act(() => {
      result.current.reload();
    });

    // Esperar a que se llame de nuevo (el efecto depende de reloadCount)
    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
