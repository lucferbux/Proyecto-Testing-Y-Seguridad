import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateOrUpdate } from '../useCreateOrUpdateProject';
import { ProjectResponse } from '../../api/api-client';

describe('useCreateOrUpdate', () => {
  it('debe crear/actualizar exitosamente', async () => {
    const mockResponse: ProjectResponse = {
      _id: '123',
      title: 'New Project',
      description: 'Test'
    };

    const mockFunction = jest.fn().mockResolvedValue(mockResponse);

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    // Estado inicial
    expect(result.current.status).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Ejecutar mutation
    await act(async () => {
      await result.current.createOrUpdate({
        title: 'New Project',
        description: 'Test'
      });
    });

    // Verificar resultado
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeUndefined();
    expect(mockFunction).toHaveBeenCalledWith({
      title: 'New Project',
      description: 'Test'
    });
  });

  it('debe establecer status "loading" durante la operación', async () => {
    // Mock con delay para ver el loading state
    const mockFunction = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    // Iniciar operación sin esperar
    act(() => {
      result.current.createOrUpdate({ title: 'Test' });
    });

    // Verificar loading inmediatamente
    expect(result.current.status).toBe('loading');

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('debe manejar errores de la API', async () => {
    const mockError = new Error('API Error');
    const mockFunction = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    await act(async () => {
      await result.current.createOrUpdate({ title: 'Test' });
    });

    expect(result.current.status).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it('debe manejar errorMessage custom', async () => {
    const mockFunction = jest.fn();

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    await act(async () => {
      await result.current.createOrUpdate(
        { title: 'Test' },
        'Custom validation error'
      );
    });

    // No debe llamar la función si hay errorMessage
    expect(mockFunction).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe('Custom validation error');
    expect(result.current.status).toBeUndefined();
  });
});