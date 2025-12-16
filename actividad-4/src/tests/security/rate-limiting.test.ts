import request from 'supertest';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, clearDatabase } from '../db-helper';

// Tests de Rate Limiting (Brute Force Protection)

describe('Pruebas de Rate Limiting', () => {
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
    it('debe permitir intentos ilimitados de login', async () => {
      // Realizar 20 intentos de login fallidos
      const attempts = [];
      for (let i = 0; i < 20; i++) {
        attempts.push(
          request(vulnerableApp).post('/api/login').send({
            username: 'test',
            password: 'wrongpassword',
          })
        );
      }

      const responses = await Promise.all(attempts);

      // Todos los intentos deben pasar (401 por credenciales invalidas, no 429)
      const allUnauthorized = responses.every((r) => r.status === 401);
      const noneRateLimited = responses.every((r) => r.status !== 429);

      expect(allUnauthorized).toBe(true);
      expect(noneRateLimited).toBe(true);
    });

    it('debe permitir intentos ilimitados de registro', async () => {
      const attempts = [];
      for (let i = 0; i < 15; i++) {
        attempts.push(
          request(vulnerableApp)
            .post('/api/register')
            .send({
              username: `user${i}`,
              email: `user${i}@test.com`,
              password: 'password123',
            })
        );
      }

      const responses = await Promise.all(attempts);

      // Ningun intento bloqueado por rate limiting
      const noneRateLimited = responses.every((r) => r.status !== 429);
      expect(noneRateLimited).toBe(true);
    });
  });

  describe('API Segura', () => {
    it('debe bloquear despues de 5 intentos fallidos de login', async () => {
      const responses = [];

      // Realizar 10 intentos secuenciales
      for (let i = 0; i < 10; i++) {
        const res = await request(secureApp).post('/api/login').send({
          email: 'test@test.com',
          password: 'wrongpassword',
        });
        responses.push(res);
      }

      // Los primeros 5 deben ser 401 (credenciales invalidas) o 400 (validacion)
      const firstFive = responses.slice(0, 5);
      const firstFiveNotRateLimited = firstFive.every((r) => r.status !== 429);
      expect(firstFiveNotRateLimited).toBe(true);

      // Despues del 5to intento, debe recibir 429
      const laterResponses = responses.slice(5);
      const hasRateLimited = laterResponses.some((r) => r.status === 429);
      expect(hasRateLimited).toBe(true);
    });

    it('debe incluir headers de rate limit en la respuesta', async () => {
      const response = await request(secureApp).post('/api/login').send({
        email: 'test@test.com',
        password: 'password123',
      });

      // Headers de rate limit
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('debe retornar mensaje descriptivo cuando se excede el limite', async () => {
      // Agotar el rate limit
      for (let i = 0; i < 6; i++) {
        await request(secureApp).post('/api/login').send({
          email: 'test@test.com',
          password: 'wrong',
        });
      }

      const response = await request(secureApp).post('/api/login').send({
        email: 'test@test.com',
        password: 'wrong',
      });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('intentos');
    });
  });
});
