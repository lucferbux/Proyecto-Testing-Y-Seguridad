import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from './Loader';
import '@testing-library/jest-dom';

describe('Loader Component', () => {
  const defaultMessage = 'Loading...';

  // Verifica que el componente renderice el mensaje de texto proporcionado
  it('renders the loader with the provided message', () => {
    render(<Loader message={defaultMessage} />);
    
    const messageElement = screen.getByText(defaultMessage);
    expect(messageElement).toBeInTheDocument();
  });

  // Verifica que la imagen del loader se renderice correctamente con su texto alternativo
  it('renders the loader image with correct alt text', () => {
    render(<Loader message={defaultMessage} />);
    
    const imageElement = screen.getByRole('img');
    expect(imageElement).toBeInTheDocument();
    
    expect(imageElement).toHaveAttribute('alt', defaultMessage);
    

    expect(imageElement.tagName).toBe('IMG');
    

  });

  // Verifica que el componente se actualice correctamente cuando cambia el mensaje
  it('renders with a different message', () => {
    const newMessage = 'Please wait...';
    render(<Loader message={newMessage} />);
    
    expect(screen.getByText(newMessage)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', newMessage);
  });

  // Verifica que la estructura DOM generada sea la esperada (Wrapper -> Card)
  it('has the correct DOM structure', () => {
    const { container } = render(<Loader message={defaultMessage} />);
    

    expect(container.firstChild).toBeInTheDocument();
    
    const card = container.firstChild?.firstChild;
    expect(card).toBeInTheDocument();
  });
});
