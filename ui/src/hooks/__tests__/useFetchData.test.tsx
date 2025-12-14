// ui/src/hooks/__tests__/useFetchData.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';

describe('useFetchData (custom hook)', () => {
  it('Estado inicial: data = initialValue, loading true, error null', () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    const initialValue = { ok: false };

    const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

    expect(result.current.data).toEqual(initialValue);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('Fetch exitoso: loading false, data actualizado, error null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ id: 1, title: 'Test Project' });
    const initialValue = { id: 0, title: 'Initial' };

    const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, title: 'Test Project' });
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('Fetch con error: loading false, error definido, data mantiene initialValue', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const initialValue = { id: 0, title: 'Initial' };

    const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(initialValue);
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('Refetch: hace fetch inicial y vuelve a hacer fetch al llamar refetch()', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, title: 'Project 1' })
      .mockResolvedValueOnce({ id: 2, title: 'Project 2' });

    const initialValue = { id: 0, title: 'Initial' };

    const { result } = renderHook(() => useFetchData(mockFetch, initialValue));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, title: 'Project 1' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ id: 2, title: 'Project 2' });
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
