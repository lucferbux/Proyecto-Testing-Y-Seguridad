import request from 'supertest';
import mongoose from 'mongoose';

// Mock de la conexión a base de datos para usar la conexión por defecto de Mongoose
// que se conecta al MongoMemoryServer en beforeAll
jest.mock('../config/connection/connection', () => {
  const mongoose = require('mongoose');
  return {
    db: mongoose.connection,
  };
});

// Mock del middleware de autenticación para saltar la verificación de token
jest.mock('../config/middleware/jwtAuth', () => ({
  isAuthenticated: (req: any, res: any, next: any) => next(),
}));

import app from '../config/server/server';
import { clearDatabase, seedUsers } from './db-helper';

describe('User API Integration Tests', () => {

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Conectar a MongoDB Memory Server
    await mongoose.connect(process.env.MONGO_URI!);
  });

  // Limpiar base de datos antes de cada test
  beforeEach(async () => {
    await clearDatabase();
  });

  // Cerrar conexión después de todos los tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==================== GET /v1/users ====================
  
  describe('GET /v1/users', () => {
    it('debe retornar array vacío inicialmente', async () => {
      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });


    it('debe retornar todos los usuarios', async () => {
      // Arrange: crear usuarios de prueba en MongoDB
      await seedUsers([
        { name: 'Alice', email: 'alice@test.com', password: 'password123' },
        { name: 'Bob', email: 'bob@test.com', password: 'password456' }
      ]);

      // Act: obtener todos los usuarios
      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('name');
      // ✅ Password NO debe retornarse (select: false en el schema)
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('debe retornar usuarios con estructura correcta de Mongoose', async () => {
      await seedUsers([
        { name: 'Test User', email: 'test@example.com', password: 'password123' }
      ]);

      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      // Mongoose retorna _id como ObjectId
      expect(response.body[0]).toMatchObject({
        _id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  // ==================== GET /v1/users/:id ====================
  
  describe('GET /v1/users/:id', () => {
    it('debe retornar usuario específico por ID', async () => {
      // Crear usuario en MongoDB
      const [user] = await seedUsers([
        { name: 'Test User', email: 'test@example.com', password: 'password123' }
      ]);

      // Obtener por ID
      const response = await request(app)
        .get(`/v1/users/${user._id}`)
        .expect(200);

      expect(response.body._id).toBe(user._id.toString());
      expect(response.body.email).toBe('test@example.com');
    });

    it('debe retornar 400 con ID inválido de MongoDB', async () => {
      const response = await request(app)
        .get('/v1/users/invalid-id')
        .expect(400);

      expect(response.body.error).toContain('Cast to ObjectId failed');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // ID válido pero no existe en DB
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  // ==================== POST /v1/users ====================
  
  describe('POST /v1/users', () => {
    it('debe crear usuario exitosamente', async () => {
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'MySecurePassword123'
      };

      const response = await request(app)
        .post('/v1/users')
        .send(newUser)
        .expect(201);

      // Verificar que retorna el usuario creado
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.name).toBe(newUser.name);
      expect(response.body).toHaveProperty('_id');
      
      // ✅ Password debe estar hasheado (bcrypt)
      expect(response.body.password).not.toBe(newUser.password);
      expect(response.body.password).toMatch(/^\$2[aby]\$/); // bcrypt pattern
    });

    it('debe validar email requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ name: 'Test User', password: 'password123' })
        .expect(400);

      // Joi validation error
      expect(response.body.error).toContain('email');
    });

    it('debe validar formato de email (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ 
          email: 'invalid-email', 
          name: 'Test', 
          password: 'password123' 
        })
        .expect(400);

      expect(response.body.error).toContain('valid email');
    });

    it('debe validar name requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('debe rechazar email duplicado (Mongoose unique)', async () => {
      // Crear primer usuario
      await request(app)
        .post('/v1/users')
        .send({ 
          email: 'test@example.com', 
          name: 'User 1', 
          password: 'password123' 
        });

      // Intentar crear segundo usuario con mismo email
      const response = await request(app)
        .post('/v1/users')
        .send({ 
          email: 'test@example.com', 
          name: 'User 2', 
          password: 'password456' 
        })
        .expect(500); // Mongoose duplicate key error

      expect(response.body.error).toContain('duplicate');
    });
  });

  // ==================== DELETE /v1/users/:id ====================
  
  describe('DELETE /v1/users/:id', () => {
    it('debe eliminar usuario existente', async () => {
      // Crear usuario
      const [user] = await seedUsers([
        { name: 'To Delete', email: 'delete@test.com', password: 'password123' }
      ]);

      // Eliminar usuario
      await request(app)
        .delete(`/v1/users/${user._id}`)
        .expect(204); // 204 No Content

      // Verificar que ya no existe
      await request(app)
        .get(`/v1/users/${user._id}`)
        .expect(404);
    });

    it('debe retornar 404 si usuario no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('debe validar ID de MongoDB', async () => {
      const response = await request(app)
        .delete('/v1/users/invalid-id')
        .expect(400);

      expect(response.body.error).toContain('Cast to ObjectId failed');
    });
  });
});