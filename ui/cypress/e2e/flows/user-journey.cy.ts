/// <reference types="cypress" />

describe('User Journey - Flujo Completo', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    // Configurar todos los mocks necesarios
    cy.mockDashboardApi();
    cy.mockLoginApi();
  });

  describe('Flujo Landing → Dashboard → Login', () => {
    it('debe completar el flujo completo de navegación', () => {
      // 1. Visitar landing y verificar título
      cy.visit('/');
      cy.get('h1').should('be.visible');

      // 2. Navegar a dashboard
      cy.get('a[href="/dashboard"]').click();
      cy.url().should('include', '/dashboard');

      // Esperar datos del dashboard
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que se muestran los datos
      cy.contains('Test User').should('be.visible');
      cy.contains('Test Project').should('be.visible');

      // 3. Navegar a admin (redirige a login si no autenticado)
      cy.get('a[href="/admin"]').click();

      // Verificar que estamos en login
      cy.url().should('include', '/login');

      // 4. Completar el formulario de login
      cy.get('input[name="email"]').should('be.visible').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      // 5. Verificar que la petición se envía correctamente
      cy.wait('@loginSuccess');

      // 6. Verificar que llegamos a admin
      cy.url().should('include', '/admin');
    });

    it('debe verificar datos en cada paso del flujo', () => {
      // En landing: verificar título visible
      cy.visit('/');
      cy.get('h1').should('be.visible');
      cy.url().should('eq', Cypress.config('baseUrl') + '/');

      // Navegar a dashboard
      cy.get('a[href="/dashboard"]').click();

      // En dashboard: verificar datos cargados
      cy.wait(['@getAboutMe', '@getProjects']);
      cy.contains('Test User').should('be.visible');
      cy.contains('Software Developer').should('be.visible');
      cy.contains('Test Project').should('be.visible');

      // Navegar a login (via admin)
      cy.get('a[href="/admin"]').click();
      cy.url().should('include', '/login');

      // En login: verificar formulario funcional
      cy.get('input[name="email"]').should('be.visible').and('be.enabled');
      cy.get('input[name="password"]').should('be.visible').and('be.enabled');
      cy.get('input[type="submit"]').should('be.visible').and('be.enabled');
    });
  });

  describe('Flujo completo con autenticación', () => {
    it('debe permitir acceso a admin después de login exitoso', () => {
      // Ir directamente a admin
      cy.visit('/admin');

      // Debería redirigir a login
      cy.url().should('include', '/login');

      // Hacer login
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      cy.wait('@loginSuccess');

      // Ahora debería estar en admin
      cy.url().should('include', '/admin');

      // Verificar que el formulario de admin existe
      cy.get('input[name="title"]').should('be.visible');
    });
  });
});

describe('Tests Adicionales (Bonus)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Opción A - Test Responsive', () => {
    it('debe funcionar en viewport mobile', () => {
      cy.mockDashboardApi();

      cy.viewport('iphone-x');
      cy.visit('/');

      // Verificar que el título se adapta
      cy.get('h1').should('be.visible');

      // Navegar al dashboard en mobile
      cy.get('a[href="/dashboard"]').click();
      cy.wait(['@getAboutMe', '@getProjects']);

      // Verificar que los datos se muestran en mobile
      cy.contains('Test User').should('be.visible');
      cy.contains('Test Project').should('be.visible');
    });

    it('debe funcionar en viewport tablet', () => {
      cy.mockDashboardApi();

      cy.viewport('ipad-2');
      cy.visit('/dashboard');

      cy.wait(['@getAboutMe', '@getProjects']);

      cy.contains('Test User').should('be.visible');
      cy.contains('Test Project').should('be.visible');
    });

    it('debe funcionar en diferentes tamaños de pantalla', () => {
      cy.mockDashboardApi();

      // Desktop grande
      cy.viewport(1920, 1080);
      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
      cy.contains('Test User').should('be.visible');

      // Tablet
      cy.mockDashboardApi();
      cy.viewport(768, 1024);
      cy.reload();
      cy.wait(['@getAboutMe', '@getProjects']);
      cy.contains('Test User').should('be.visible');

      // Mobile
      cy.mockDashboardApi();
      cy.viewport(375, 667);
      cy.reload();
      cy.wait(['@getAboutMe', '@getProjects']);
      cy.contains('Test User').should('be.visible');
    });
  });

  describe('Opción B - Test de Navegación con Teclado', () => {
    it('debe permitir navegar con teclado en login usando Tab', () => {
      cy.mockLoginApi();

      cy.visit('/login');

      // Focus en email y escribir
      cy.get('input[name="email"]').focus().type('test@example.com');

      // Usar Tab para navegar al siguiente campo (simulado con {tab})
      cy.get('input[name="email"]').type('{tab}');

      // El focus debería estar en password
      cy.focused().should('have.attr', 'name', 'password');

      // Escribir password
      cy.focused().type('password123');
    });

    it('debe enviar formulario con Enter', () => {
      cy.mockLoginApi();

      cy.visit('/login');

      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123{enter}');

      cy.wait('@loginSuccess');
      cy.url().should('include', '/admin');
    });

    it('debe permitir escribir en campos con focus', () => {
      cy.visit('/login');

      // Focus en email y escribir
      cy.get('input[name="email"]').focus();
      cy.focused().type('test@example.com');
      cy.get('input[name="email"]').should('have.value', 'test@example.com');

      // Focus en password y escribir
      cy.get('input[name="password"]').focus();
      cy.focused().type('password123');
      cy.get('input[name="password"]').should('have.value', 'password123');
    });

    it('debe permitir completar el flujo completo con teclado', () => {
      cy.mockLoginApi();

      cy.visit('/login');

      // Completar formulario solo con teclado
      cy.get('input[name="email"]')
        .focus()
        .type('test@example.com{tab}'); // Tab al password

      cy.focused()
        .should('have.attr', 'name', 'password')
        .type('password123{enter}'); // Enter para submit

      cy.wait('@loginSuccess');
      cy.url().should('include', '/admin');
    });
  });

  describe('Opción C - Test de Verificación de Request Body', () => {
    it('debe enviar credenciales correctamente en el body', () => {
      // JWT válido para la respuesta
      const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';

      cy.intercept('POST', '**/auth/login', (req) => {
        // Verificar que el body contiene las credenciales
        // La app usa URLSearchParams, así que el body es un string codificado
        expect(req.body).to.include('email');
        expect(req.body).to.include('password');
        expect(req.body).to.include('test%40example.com'); // @ encoded
        expect(req.body).to.include('password123');

        req.reply({
          statusCode: 200,
          body: { token: validJwtToken }
        });
      }).as('loginWithBody');

      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      cy.wait('@loginWithBody');
      cy.url().should('include', '/admin');
    });

    it('debe enviar peticiones GET correctamente al dashboard', () => {
      cy.intercept('GET', '**/v1/aboutme/', (req) => {
        // Verificar headers o parámetros si es necesario
        expect(req.method).to.eq('GET');

        req.reply({
          statusCode: 200,
          body: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Verified User',
            birthday: 631152000000,
            nationality: 'Spanish',
            job: 'Developer',
            github: 'https://github.com/test'
          }
        });
      }).as('getAboutMeVerified');

      cy.intercept('GET', '**/v1/projects/', (req) => {
        expect(req.method).to.eq('GET');

        req.reply({
          statusCode: 200,
          body: [{
            _id: '507f1f77bcf86cd799439012',
            title: 'Verified Project',
            description: 'Project from verified request',
            version: '1.0.0',
            link: 'https://github.com/test',
            tag: 'test',
            timestamp: Date.now()
          }]
        });
      }).as('getProjectsVerified');

      cy.visit('/dashboard');
      cy.wait(['@getAboutMeVerified', '@getProjectsVerified']);

      cy.contains('Verified User').should('be.visible');
      cy.contains('Verified Project').should('be.visible');
    });

    it('debe manejar diferentes tipos de content-type en login', () => {
      const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';

      cy.intercept('POST', '**/auth/login', (req) => {
        // Verificar content-type (la app usa URLSearchParams)
        expect(req.headers['content-type']).to.include('application/x-www-form-urlencoded');

        req.reply({
          statusCode: 200,
          body: { token: validJwtToken }
        });
      }).as('loginContentType');

      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      cy.wait('@loginContentType');
    });
  });
});
