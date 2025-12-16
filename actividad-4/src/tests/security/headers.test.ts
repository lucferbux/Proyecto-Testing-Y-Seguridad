import request from 'supertest';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';

// Tests de Security Headers (Helmet)

describe('Pruebas de Headers de Seguridad', () => {
  describe('API Vulnerable', () => {
    it('debe exponer X-Powered-By header', async () => {
      const response = await request(vulnerableApp).get('/api/search').query({ q: 'test' });

      // La API vulnerable expone que usa Express
      expect(response.headers['x-powered-by']).toBeDefined();
      expect(response.headers['x-powered-by']).toContain('Express');
    });

    it('no debe tener X-Content-Type-Options header', async () => {
      const response = await request(vulnerableApp).get('/api/search').query({ q: 'test' });

      // Sin proteccion contra MIME sniffing
      expect(response.headers['x-content-type-options']).toBeUndefined();
    });

    it('no debe tener X-Frame-Options header', async () => {
      const response = await request(vulnerableApp).get('/api/search').query({ q: 'test' });

      // Vulnerable a clickjacking
      expect(response.headers['x-frame-options']).toBeUndefined();
    });

    it('no debe tener Content-Security-Policy header', async () => {
      const response = await request(vulnerableApp).get('/api/search').query({ q: 'test' });

      expect(response.headers['content-security-policy']).toBeUndefined();
    });

    it('no debe tener Strict-Transport-Security header', async () => {
      const response = await request(vulnerableApp).get('/api/search').query({ q: 'test' });

      // Sin HSTS
      expect(response.headers['strict-transport-security']).toBeUndefined();
    });
  });

  describe('API Segura', () => {
    it('no debe exponer X-Powered-By header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      // Helmet oculta X-Powered-By
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('debe incluir X-Content-Type-Options: nosniff', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      // Previene MIME sniffing
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('debe incluir X-Frame-Options header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      // Previene clickjacking
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('debe incluir Content-Security-Policy header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      // CSP configurado
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('debe incluir X-DNS-Prefetch-Control header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    });

    it('debe incluir Cross-Origin-Opener-Policy header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      expect(response.headers['cross-origin-opener-policy']).toBeDefined();
    });

    it('debe incluir Referrer-Policy header', async () => {
      const response = await request(secureApp).get('/api/search').query({ q: 'test' });

      expect(response.headers['referrer-policy']).toBeDefined();
    });
  });
});
