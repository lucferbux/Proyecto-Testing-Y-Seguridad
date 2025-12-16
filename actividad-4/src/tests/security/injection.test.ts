import request from 'supertest';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';
import { VulnerableUser } from '../../vulnerable-api/models/user.model';
import { SecureUser } from '../../secure-api/models/user.model';
import { connectDB, disconnectDB, clearDatabase } from '../db-helper';

// Tests de NoSQL Injection

describe('Pruebas de Inyeccion NoSQL', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('API Vulnerable', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      await VulnerableUser.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'secretpassword123',
        role: 'admin',
      });
    });

    it('debe ser vulnerable a inyeccion NoSQL con operador $ne en login', async () => {
      // Payload de NoSQL injection
      const response = await request(vulnerableApp)
        .post('/api/login')
        .send({
          username: { $ne: null }, // Cualquier username que no sea null
          password: { $ne: null }, // Cualquier password que no sea null
        });

      // La API vulnerable permite el bypass
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('debe ser vulnerable a inyeccion NoSQL en query params', async () => {
      // Obtener todos los usuarios con $ne
      const response = await request(vulnerableApp)
        .get('/api/users')
        .query({ email: { $ne: null } });

      // Retorna usuarios aunque no deberia
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('debe ser vulnerable a operador $gt', async () => {
      const response = await request(vulnerableApp)
        .post('/api/login')
        .send({
          username: { $gt: '' },
          password: { $gt: '' },
        });

      // Bypass exitoso
      expect(response.status).toBe(200);
    });

    it('debe ser vulnerable a operador $regex', async () => {
      const response = await request(vulnerableApp)
        .post('/api/login')
        .send({
          username: { $regex: '.*' },
          password: { $regex: '.*' },
        });

      expect(response.status).toBe(200);
    });
  });

  describe('API Segura', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      await SecureUser.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'SecurePass123!',
        role: 'admin',
      });
    });

    it('debe rechazar operador $ne en login', async () => {
      const response = await request(secureApp)
        .post('/api/login')
        .send({
          email: { $ne: null },
          password: { $ne: null },
        });

      // La API segura rechaza el intento
      expect(response.status).toBe(400);
    });

    it('debe rechazar operador $gt en login', async () => {
      const response = await request(secureApp)
        .post('/api/login')
        .send({
          email: { $gt: '' },
          password: { $gt: '' },
        });

      expect(response.status).toBe(400);
    });

    it('debe rechazar operador $regex en login', async () => {
      const response = await request(secureApp)
        .post('/api/login')
        .send({
          email: { $regex: '.*' },
          password: { $regex: '.*' },
        });

      expect(response.status).toBe(400);
    });

    it('debe sanitizar query params en busqueda de usuarios', async () => {
      // Generar token de admin para acceder
      const loginResponse = await request(secureApp).post('/api/login').send({
        email: 'admin@test.com',
        password: 'SecurePass123!',
      });

      const token = loginResponse.body.token;

      // Intentar NoSQL injection via query (sanitizado por mongoSanitize)
      const response = await request(secureApp)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ email: { $ne: null } });

      // No debe permitir el operador
      // El middleware mongoSanitize remueve caracteres $
      expect(response.status).not.toBe(200);
    });

    it('debe validar que email y password sean strings', async () => {
      const response = await request(secureApp)
        .post('/api/login')
        .send({
          email: ['array', 'injection'],
          password: 123456,
        });

      expect(response.status).toBe(400);
    });

    it('debe prevenir inyeccion en registro', async () => {
      const response = await request(secureApp)
        .post('/api/register')
        .send({
          username: { $ne: null },
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
    });
  });
});
