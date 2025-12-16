import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
  // ============================================
  // Renderizado Básico Tests
  // ============================================
  describe('Renderizado básico', () => {
    it('debe renderizar el mensaje correctamente', () => {
      const testMessage = 'Cargando datos...';
      render(<Loader message={testMessage} />);

      expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('debe renderizar la imagen del loader', () => {
      const testMessage = 'Loading';
      render(<Loader message={testMessage} />);

      const loaderImage = screen.getByAltText(testMessage);
      expect(loaderImage).toBeInTheDocument();
      expect(loaderImage).toHaveAttribute('src');
    });

    it('debe renderizar con diferentes mensajes', () => {
      const { rerender } = render(<Loader message="Primer mensaje" />);
      expect(screen.getByText('Primer mensaje')).toBeInTheDocument();

      rerender(<Loader message="Segundo mensaje" />);
      expect(screen.getByText('Segundo mensaje')).toBeInTheDocument();
      expect(screen.queryByText('Primer mensaje')).not.toBeInTheDocument();
    });

    it('debe tener la estructura DOM correcta', () => {
      const testMessage = 'Test';
      const { container } = render(<Loader message={testMessage} />);

      expect(container.firstChild).toBeInTheDocument();

      const image = screen.getByAltText(testMessage);
      const text = screen.getByText(testMessage);
      expect(image).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });

  // ============================================
  // Snapshot Tests
  // ============================================
  describe('Snapshots', () => {
    it('debe coincidir con el snapshot para mensaje estándar', () => {
      const { container } = render(<Loader message="Cargando..." />);
      expect(container).toMatchSnapshot();
    });

    it('debe coincidir con el snapshot para mensaje largo', () => {
      const longMessage =
        'Por favor espere mientras cargamos todos los datos necesarios para mostrar la información';
      const { container } = render(<Loader message={longMessage} />);
      expect(container).toMatchSnapshot();
    });

    it('debe coincidir con el snapshot para mensaje corto', () => {
      const { container } = render(<Loader message="..." />);
      expect(container).toMatchSnapshot();
    });
  });

  // ============================================
  // Tests de Accesibilidad
  // ============================================
  describe('Accesibilidad', () => {
    it('la imagen debe tener atributo alt descriptivo', () => {
      const descriptiveMessage = 'Cargando información del usuario';
      render(<Loader message={descriptiveMessage} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', descriptiveMessage);
    });

    it('debe tener un elemento img con rol correcto', () => {
      render(<Loader message="Loading" />);

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('el texto del mensaje debe ser visible', () => {
      const message = 'Texto visible';
      render(<Loader message={message} />);

      const textElement = screen.getByText(message);
      expect(textElement).toBeVisible();
    });

    it('la imagen debe estar presente y visible', () => {
      const message = 'Test accesibilidad';
      render(<Loader message={message} />);

      const image = screen.getByAltText(message);
      expect(image).toBeVisible();
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('debe manejar mensaje vacío', () => {
      const { container } = render(<Loader message="" />);

      expect(container.firstChild).toBeInTheDocument();

      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('alt', '');
    });

    it('debe manejar mensaje con caracteres especiales', () => {
      const specialMessage = '¡Cargando! @#$%^&*() 日本語 émoji 🚀';
      render(<Loader message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('debe manejar mensaje solo con espacios', () => {
      const spacesMessage = '   ';
      const { container } = render(<Loader message={spacesMessage} />);

      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
    });

    it('debe manejar mensaje con saltos de línea', () => {
      const multilineMessage = 'Línea 1\nLínea 2';
      const { container } = render(<Loader message={multilineMessage} />);

      expect(container.firstChild).toBeInTheDocument();
      const image = container.querySelector('img');
      expect(image).toHaveAttribute('alt', multilineMessage);
    });

    it('debe manejar mensaje muy largo sin romper el layout', () => {
      const veryLongMessage = 'A'.repeat(500);
      const { container } = render(<Loader message={veryLongMessage} />);

      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText(veryLongMessage)).toBeInTheDocument();
    });
  });

  // ============================================
  // Tests de Props
  // ============================================
  describe('Props', () => {
    it('debe aceptar la prop message como string', () => {
      const message = 'Test message prop';
      render(<Loader message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('debe usar el message tanto para el texto como para el alt de la imagen', () => {
      const message = 'Mensaje compartido';
      render(<Loader message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();

      const image = screen.getByAltText(message);
      expect(image).toBeInTheDocument();
    });
  });

  // ============================================
  // Tests de Estilos (básicos)
  // ============================================
  describe('Estilos básicos', () => {
    it('debe renderizar el contenedor wrapper', () => {
      const { container } = render(<Loader message="Test" />);

      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.childNodes.length).toBeGreaterThan(0);
    });

    it('debe renderizar la imagen con src definido', () => {
      render(<Loader message="Test" />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src');
      expect(image.getAttribute('src')).toBeTruthy();
    });
  });
});