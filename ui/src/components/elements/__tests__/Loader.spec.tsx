import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
  
  it('debe renderizar el mensaje correctamente', () => {
    const testMessage = 'Cargando datos...';
    render(<Loader message={testMessage} />);
    
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('debe renderizar la imagen del loader', () => {
    const testMessage = 'Loading';
    render(<Loader message={testMessage} />);
    
    // Buscar por alt text (accesibilidad)
    const loaderImage = screen.getByAltText(testMessage);
    expect(loaderImage).toBeInTheDocument();
    expect(loaderImage).toHaveAttribute('src');
  });

  it('debe renderizar con diferentes mensajes', () => {
    const { rerender } = render(<Loader message="Primer mensaje" />);
    expect(screen.getByText('Primer mensaje')).toBeInTheDocument();
    
    // Re-renderizar con nuevo mensaje
    rerender(<Loader message="Segundo mensaje" />);
    expect(screen.getByText('Segundo mensaje')).toBeInTheDocument();
    expect(screen.queryByText('Primer mensaje')).not.toBeInTheDocument();
  });

  it('debe tener la estructura DOM correcta', () => {
    const testMessage = 'Test';
    const { container } = render(<Loader message={testMessage} />);
    
    // Verificar que hay un contenedor principal (LoaderWrapper)
    expect(container.firstChild).toBeInTheDocument();
    
    // Verificar que contiene tanto imagen como mensaje
    const image = screen.getByAltText(testMessage);
    const text = screen.getByText(testMessage);
    expect(image).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });
});