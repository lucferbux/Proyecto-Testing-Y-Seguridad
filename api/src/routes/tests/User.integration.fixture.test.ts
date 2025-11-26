import { validUser, invalidUsers, sampleUsers } from '../../tests/fixtures/users';
import request from 'supertest';
import mongoose from 'mongoose';

describe('User API Integration Tests with Fixtures', () => {
  let app: any;
  let clearDatabase: any;
  let seedUsers: any;
  let dbConnection: any;

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Configurar variables de entorno para que la app use la base de datos en memoria
    process.env.MONGODB_URI = process.env.MONGO_URI!;
    process.env.MONGODB_DB_MAIN = '';

    // Resetear módulos para recargar la configuración con las nuevas variables de entorno
    jest.resetModules();

    // Mock auth middleware to bypass authentication
    jest.doMock('../../config/middleware/jwtAuth', () => ({
      isAuthenticated: (req: any, res: any, next: any) => next(),
    }));

    // Importar app y helpers dinámicamente
    app = require('../../config/server/server').default;
    const dbHelper = require('../../tests/db-helper');
    clearDatabase = dbHelper.clearDatabase;
    seedUsers = dbHelper.seedUsers;
    
    // Obtener la conexión de la base de datos para cerrarla después
    dbConnection = require('../../config/connection/connection').db;
  });

  // Limpiar base de datos antes de cada test
  beforeEach(async () => {
    await clearDatabase();
  });

  // Cerrar conexión después de todos los tests
  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close();
    }
    await mongoose.connection.close();
  });

  // ==================== POST /v1/users con Fixtures ====================
  
  describe('POST /v1/users', () => {
    it('debe crear usuario con fixture válido', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe(validUser.email);
      // Password debe estar hasheado
      expect(response.body.password).toMatch(/^\$2[aby]\$/);
    });

    it('debe rechazar usuario sin email (fixture noEmail)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(invalidUsers.noEmail)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('debe rechazar usuario sin password (fixture noPassword)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(invalidUsers.noPassword)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('debe rechazar email inválido (fixture invalidEmail)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(invalidUsers.invalidEmail)
        .expect(400);

      expect(response.body.message).toContain('valid email');
    });
  });

  // ==================== GET /v1/users con Fixtures ====================

  describe('GET /v1/users', () => {
    it('debe retornar todos los usuarios usando sampleUsers fixture', async () => {
      // Seed con fixture de usuarios de muestra
      await seedUsers(sampleUsers);

      const response = await request(app)
        .get('/v1/users')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(sampleUsers.length);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('email');
      // Password no debe retornarse
      expect(response.body[0]).not.toHaveProperty('password');
    });
  });

  // ==================== DELETE /v1/users con Fixtures ====================

  describe('DELETE /v1/users/:id', () => {
    it('debe eliminar usuario creado con fixture', async () => {
      // Crear usuario con fixture
      const [user] = await seedUsers([validUser]);

      // Eliminar usuario
      await request(app)
        .delete(`/v1/users/${user._id}`)
        .set('Accept', 'application/json')
        .expect(200);

      // Verificar que ya no existe
      await request(app)
        .get(`/v1/users/${user._id}`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});