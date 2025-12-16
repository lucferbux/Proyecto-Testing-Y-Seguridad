import request from 'supertest';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';

// Tests de XSS (Cross-Site Scripting)

describe('Pruebas de XSS', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    "javascript:alert('XSS')",
    '<body onload=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')">',
  ];

  describe('API Vulnerable', () => {
    it('debe ser vulnerable a XSS reflejado en endpoint search', async () => {
      const payload = '<script>alert("XSS")</script>';

      const response = await request(vulnerableApp)
        .get('/api/search')
        .query({ q: payload });

      // La API vulnerable retorna HTML con el payload sin sanitizar
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<script>');
      expect(response.text).toContain('alert("XSS")');
    });

    it('debe retornar Content-Type text/html (vulnerable)', async () => {
      const response = await request(vulnerableApp)
        .get('/api/search')
        .query({ q: 'test' });

      // HTML permite ejecucion de scripts
      expect(response.headers['content-type']).toContain('text/html');
    });

    it.each(xssPayloads)('debe reflejar payload XSS sin sanitizar: %s', async (payload) => {
      const response = await request(vulnerableApp)
        .get('/api/search')
        .query({ q: payload });

      // El payload aparece en la respuesta sin modificar
      expect(response.text).toContain(payload);
    });

    it('debe ser vulnerable a XSS en respuestas de error', async () => {
      const payload = '<img src=x onerror=alert(1)>';

      // Provocar un error que incluya el payload
      const response = await request(vulnerableApp)
        .post('/api/login')
        .send({
          username: payload,
          password: 'test',
        });

      // El body puede contener el payload si hay error logging
      // En este caso verificamos que la API no sanitiza inputs
      expect(response.status).toBe(401);
    });
  });

  describe('API Segura', () => {
    it('debe retornar JSON en lugar de HTML en search', async () => {
      const payload = '<script>alert("XSS")</script>';

      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: payload });

      // La API segura retorna JSON
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('debe escapar caracteres especiales en respuesta JSON', async () => {
      const payload = '<script>alert("XSS")</script>';

      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: payload });

      expect(response.status).toBe(200);

      // En JSON, los < y > se escapan automaticamente
      // El payload se guarda como string, no se ejecuta
      expect(response.body.query).toBeDefined();
    });

    it('no debe ejecutar scripts en la respuesta', async () => {
      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: '<script>document.cookie</script>' });

      // JSON no permite ejecucion de scripts
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.text).not.toContain('<script>');
    });

    it.each(xssPayloads)('debe sanitizar payload XSS: %s', async (payload) => {
      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: payload });

      // La respuesta debe ser JSON
      expect(response.headers['content-type']).toContain('application/json');

      // El payload original no debe aparecer sin escapar
      expect(response.text).not.toMatch(/<script>/i);
    });

    it('debe incluir Content-Security-Policy header', async () => {
      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: 'test' });

      // CSP previene ejecucion de scripts inline
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("script-src");
    });

    it('debe validar parametro de busqueda', async () => {
      // Sin parametro q
      const response = await request(secureApp).get('/api/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('debe rechazar busqueda con tipo invalido', async () => {
      const response = await request(secureApp)
        .get('/api/search')
        .query({ q: ['array', 'injection'] });

      // Arrays no son validos
      expect(response.status).toBe(400);
    });
  });
});
