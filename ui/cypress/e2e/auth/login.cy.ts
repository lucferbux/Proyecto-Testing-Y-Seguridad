/// <reference types="cypress" />

describe('Login Page', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    cy.clearLocalStorage();
  });

  describe('Validación de campos', () => {
    it('debe mostrar error cuando los campos están vacíos', () => {
      cy.visit('/login');

      // Intentar submit sin llenar campos
      cy.get('input[type="submit"]').click();

      // Verificar que aparece mensaje de error
      // El mensaje de error debe ser visible (login.err_usr_pass)
      cy.contains('Please enter your username and password').should('be.visible');
    });

    it('debe mostrar error cuando solo el email está vacío', () => {
      cy.visit('/login');

      // Llenar solo password
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      // Verificar que aparece mensaje de error
      cy.contains('Please enter your username and password').should('be.visible');
    });

    it('debe mostrar error cuando solo el password está vacío', () => {
      cy.visit('/login');

      // Llenar solo email
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[type="submit"]').click();

      // Verificar que aparece mensaje de error
      cy.contains('Please enter your username and password').should('be.visible');
    });
  });

  describe('Login exitoso', () => {
    it('debe hacer login exitoso con credenciales válidas', () => {
      // Configurar mock de login exitoso
      cy.mockLoginApi();

      cy.visit('/login');

      // Llenar formulario con credenciales válidas
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');

      // Submit
      cy.get('input[type="submit"]').click();

      // Esperar la petición y verificar redirección
      cy.wait('@loginSuccess');
      cy.url().should('include', '/admin');
    });

    it('debe almacenar el token en localStorage después del login', () => {
      cy.mockLoginApi();

      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();

      cy.wait('@loginSuccess');

      // Verificar que el token se guardó
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.not.be.null;
      });
    });
  });

  describe('Login fallido', () => {
    it('debe mostrar error con credenciales inválidas', () => {
      // Configurar mock de login fallido
      cy.mockLoginApi({ success: false });

      cy.visit('/login');

      // Llenar formulario
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');

      // Submit
      cy.get('input[type="submit"]').click();

      // Esperar la petición
      cy.wait('@loginError');

      // Verificar que aparece mensaje de error
      cy.contains('Invalid login').should('be.visible');

      // Verificar que seguimos en /login
      cy.url().should('include', '/login');
    });

    it('debe limpiar el error al modificar los campos', () => {
      cy.mockLoginApi({ success: false });

      cy.visit('/login');
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('input[type="submit"]').click();

      cy.wait('@loginError');
      cy.contains('Invalid login').should('be.visible');

      // Modificar un campo y verificar que el error desaparece
      cy.get('input[name="email"]').clear().type('new@example.com');
      cy.contains('Invalid login').should('not.exist');
    });
  });

  describe('Estado de loading', () => {
    it('debe mostrar indicador de loading durante la petición', () => {
      // Configurar mock con delay para ver el loading
      cy.mockLoginApi({ delay: 1000 });

      cy.visit('/login');

      // Llenar formulario
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');

      // Submit
      cy.get('input[type="submit"]').click();

      // Verificar que aparece el loader
      cy.get('img[alt]').should('be.visible');

      // Esperar a que termine la petición
      cy.wait('@loginSuccess');

      // Verificar redirección
      cy.url().should('include', '/admin');
    });
  });

  describe('Navegación', () => {
    it('debe poder navegar a la página de login desde el header', () => {
      cy.visit('/');

      // Verificar que existe un link al admin (que redirige a login si no está autenticado)
      cy.get('a[href="/admin"]').click();

      // Debería redirigir a login ya que no está autenticado
      cy.url().should('include', '/login');
    });
  });
});
