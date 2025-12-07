import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutMeCard from '../AboutMeCard';
import { AboutMe } from '../../../model/aboutme';

// Mock de i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'aboutMeCard.name': 'Name',
        'aboutMeCard.birthdate': 'Birthdate',
        'aboutMeCard.nationality': 'Nationality',
        'aboutMeCard.occupation': 'Occupation',
        'aboutMeCard.github': 'GitHub',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de api-client-factory (necesario para evitar import.meta.env)
jest.mock('../../../api/api-client-factory', () => ({
  getApiClient: jest.fn(),
}));

describe('AboutMeCard', () => {
  const mockAboutMe: AboutMe = {
    _id: '1',
    name: 'John Doe',
    birthday: 631152000000, // 1990-01-01
    nationality: 'Spanish',
    job: 'Software Developer',
    github: 'https://github.com/johndoe',
  };

  describe('Renderizado básico', () => {
    it('debe renderizar la información completa del usuario', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Birthdate')).toBeInTheDocument();
      expect(screen.getByText('12/31/1989')).toBeInTheDocument();
      expect(screen.getByText('Nationality')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('https://github.com/johndoe')).toBeInTheDocument();
    });

    it('debe renderizar solo el nombre cuando otros campos son undefined', () => {
      const minimalAboutMe: AboutMe = {
        _id: '2',
        name: 'Jane Smith',
      };

      render(<AboutMeCard aboutMe={minimalAboutMe} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      
      // Los demás campos no deben aparecer
      expect(screen.queryByText('Birthdate')).not.toBeInTheDocument();
      expect(screen.queryByText('Nationality')).not.toBeInTheDocument();
      expect(screen.queryByText('Occupation')).not.toBeInTheDocument();
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    });

    it('debe renderizar la imagen de avatar', () => {
      const { container } = render(<AboutMeCard aboutMe={mockAboutMe} />);

      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });
  });

  describe('Renderizado condicional de campos', () => {
    it('debe renderizar birthday cuando está presente', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      expect(screen.getByText('Birthdate')).toBeInTheDocument();
      expect(screen.getByText('12/31/1989')).toBeInTheDocument();
    });

    it('NO debe renderizar birthday cuando es undefined', () => {
      const aboutMeWithoutBirthday: AboutMe = {
        ...mockAboutMe,
        birthday: undefined,
      };

      render(<AboutMeCard aboutMe={aboutMeWithoutBirthday} />);

      expect(screen.queryByText('Birthdate')).not.toBeInTheDocument();
    });

    it('debe renderizar nationality cuando está presente', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      expect(screen.getByText('Nationality')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });

    it('NO debe renderizar nationality cuando es undefined', () => {
      const aboutMeWithoutNationality: AboutMe = {
        ...mockAboutMe,
        nationality: undefined,
      };

      render(<AboutMeCard aboutMe={aboutMeWithoutNationality} />);

      expect(screen.queryByText('Nationality')).not.toBeInTheDocument();
    });

    it('debe renderizar job cuando está presente', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
    });

    it('NO debe renderizar job cuando es undefined', () => {
      const aboutMeWithoutJob: AboutMe = {
        ...mockAboutMe,
        job: undefined,
      };

      render(<AboutMeCard aboutMe={aboutMeWithoutJob} />);

      expect(screen.queryByText('Occupation')).not.toBeInTheDocument();
    });

    it('debe renderizar github cuando está presente', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('https://github.com/johndoe')).toBeInTheDocument();
    });

    it('NO debe renderizar github cuando es undefined', () => {
      const aboutMeWithoutGithub: AboutMe = {
        ...mockAboutMe,
        github: undefined,
      };

      render(<AboutMeCard aboutMe={aboutMeWithoutGithub} />);

      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    });
  });

  describe('Estructura DOM', () => {
    it('debe tener la estructura correcta', () => {
      const { container } = render(<AboutMeCard aboutMe={mockAboutMe} />);

      // Verificar que hay un contenedor principal
      expect(container.firstChild).toBeInTheDocument();

      // Verificar que contiene imagen y secciones de información
      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
    });

    it('debe renderizar con diferentes datos de AboutMe', () => {
      const { rerender } = render(<AboutMeCard aboutMe={mockAboutMe} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Re-renderizar con nuevos datos
      const newAboutMe: AboutMe = {
        _id: '3',
        name: 'Alice Johnson',
        job: 'Designer',
      };

      rerender(<AboutMeCard aboutMe={newAboutMe} />);
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Internacionalización', () => {
    it('debe usar las traducciones correctas para los labels', () => {
      render(<AboutMeCard aboutMe={mockAboutMe} />);

      // Verificar que se usan las traducciones
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Birthdate')).toBeInTheDocument();
      expect(screen.getByText('Nationality')).toBeInTheDocument();
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });
});
