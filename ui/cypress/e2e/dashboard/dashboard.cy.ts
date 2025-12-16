/// <reference types="cypress" />

describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Carga de datos con fixtures', () => {
    it('debe cargar y mostrar datos del dashboard usando fixtures', () => {
      // Interceptar APIs con fixtures
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');

      cy.visit('/dashboard');

      // Esperar ambas peticiones
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que se muestra el nombre del fixture aboutme.json
      cy.contains('Lucas Fernandez').should('be.visible');

      // Verificar que se muestran los proyectos del fixture
      cy.contains('Taller Testing & Security').should('be.visible');
      cy.contains('React Dashboard').should('be.visible');
    });

    it('debe mostrar información de AboutMe correctamente', () => {
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');

      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar datos de AboutMe
      cy.contains('Lucas Fernandez').should('be.visible');
      cy.contains('Spanish').should('be.visible');
      cy.contains('Software Developer').should('be.visible');
    });

    it('debe mostrar información de proyectos correctamente', () => {
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');

      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que los proyectos se muestran con su información
      cy.contains('Taller Testing & Security').should('be.visible');
      cy.contains('Proyecto educativo sobre testing y seguridad').should('be.visible');

      cy.contains('React Dashboard').should('be.visible');
      cy.contains('Dashboard interactivo con React').should('be.visible');
    });
  });

  describe('Estado de loading', () => {
    it('debe mostrar loading mientras cargan los datos', () => {
      // Usar mockDashboardApi con delay
      cy.mockDashboardApi({ delay: 1000 });

      cy.visit('/dashboard');

      // Verificar que aparece el loader
      cy.contains('Loading data').should('be.visible');

      // Esperar a que carguen los datos
      cy.wait(['@getAboutMe', '@getProjects']);

      // El loader debería desaparecer
      cy.contains('Loading data').should('not.exist');
    });

    it('debe mostrar datos después del loading', () => {
      cy.mockDashboardApi({ delay: 500 });

      cy.visit('/dashboard');

      // Verificar loading inicial
      cy.contains('Loading data').should('be.visible');

      // Esperar peticiones
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que se muestran los datos
      cy.contains('Test User').should('be.visible');
      cy.contains('Test Project').should('be.visible');
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la API', () => {
      // Usar mockDashboardApi con error
      cy.mockDashboardApi({ error: true });

      cy.visit('/dashboard');

      // Esperar las peticiones fallidas
      cy.wait(['@getAboutMeError', '@getProjectsError']);

      // Verificar que aparece mensaje de error
      cy.contains('Error').should('be.visible');
    });

    it('debe mostrar error cuando falla aboutme', () => {
      cy.intercept('GET', '**/v1/aboutme/', { statusCode: 500 }).as('getAboutMeError');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');

      cy.visit('/dashboard');
      cy.wait(['@getAboutMeError', '@getProjects']);

      // Debería mostrar error
      cy.contains('Error').should('be.visible');
    });
  });

  describe('Navegación desde dashboard', () => {
    it('debe navegar a Home desde el header', () => {
      cy.mockDashboardApi();

      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);

      // Click en el link de Home
      cy.get('a[href="/"]').first().click();

      // Verificar que la URL cambió
      cy.url().should('eq', Cypress.config('baseUrl') + '/');
    });

    it('debe navegar a Admin desde el header', () => {
      cy.mockDashboardApi();

      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);

      // Click en el link de Admin
      cy.get('a[href="/admin"]').click();

      // Debería redirigir a login ya que no está autenticado
      cy.url().should('include', '/login');
    });

    it('debe poder volver al dashboard después de navegar', () => {
      cy.mockDashboardApi();

      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);

      // Ir a Home
      cy.get('a[href="/"]').first().click();
      cy.url().should('eq', Cypress.config('baseUrl') + '/');

      // Volver al dashboard
      cy.mockDashboardApi(); // Re-mockear para la nueva visita
      cy.get('a[href="/dashboard"]').click();
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que estamos en dashboard con datos
      cy.url().should('include', '/dashboard');
      cy.contains('Test User').should('be.visible');
    });
  });

  describe('Usando visitWithMocks', () => {
    it('debe cargar el dashboard con visitWithMocks', () => {
      cy.visitWithMocks('/dashboard');

      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que se muestran los datos por defecto
      cy.contains('Test User').should('be.visible');
      cy.contains('Test Project').should('be.visible');
    });

    it('debe manejar errores con visitWithMocks', () => {
      cy.visitWithMocks('/dashboard', { error: true });

      cy.wait(['@getAboutMeError', '@getProjectsError']);

      cy.contains('Error').should('be.visible');
    });

    it('debe mostrar loading con visitWithMocks y delay', () => {
      cy.visitWithMocks('/dashboard', { delay: 1000 });

      cy.contains('Loading data').should('be.visible');

      cy.wait(['@getAboutMe', '@getProjects']);

      cy.contains('Test User').should('be.visible');
    });
  });
});
