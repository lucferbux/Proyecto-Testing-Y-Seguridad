import request from 'supertest';
import mongoose from 'mongoose';

describe('User API Integration Tests', () => {
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

  // ==================== GET /v1/users ====================
  
  describe('GET /v1/users', () => {
    it('debe retornar array vacío inicialmente', async () => {
      const response = await request(app)
        .get('/v1/users')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar todos los usuarios', async () => {
      // Arrange: crear usuarios de prueba en MongoDB
      await seedUsers([
        { email: 'alice@test.com', password: 'password123' },
        { email: 'bob@test.com', password: 'password456' }
      ]);

      // Act: obtener todos los usuarios
      const response = await request(app)
        .get('/v1/users')
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('email');
      // ✅ Password NO debe retornarse (select: false en el schema)
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('debe retornar usuarios con estructura correcta de Mongoose', async () => {
      await seedUsers([
        { email: 'test@example.com', password: 'password123' }
      ]);

      const response = await request(app)
        .get('/v1/users')
        .set('Accept', 'application/json')
        .expect(200);

      // Mongoose retorna _id como ObjectId
      expect(response.body[0]).toMatchObject({
        _id: expect.any(String),
        email: 'test@example.com',
      });
    });
  });

  // ==================== GET /v1/users/:id ====================
  
  describe('GET /v1/users/:id', () => {
    it('debe retornar usuario específico por ID', async () => {
      // Crear usuario en MongoDB
      const [user] = await seedUsers([
        { email: 'test@example.com', password: 'password123' }
      ]);

      // Obtener por ID
      const response = await request(app)
        .get(`/v1/users/${user._id}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body._id).toBe(user._id.toString());
      expect(response.body.email).toBe('test@example.com');
    });

    it('debe retornar 400 con ID inválido de MongoDB', async () => {
      const response = await request(app)
        .get('/v1/users/invalid-id')
        .set('Accept', 'application/json')
        .expect(400);

      expect(response.body.message).toContain('Cast to ObjectId failed');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // ID válido pero no existe en DB
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/v1/users/${fakeId}`)
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  // ==================== POST /v1/users ====================
  
  describe('POST /v1/users', () => {
    it('debe crear usuario exitosamente', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'MySecurePassword123'
      };

      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(newUser)
        .expect(201);

      // Verificar que retorna el usuario creado
      expect(response.body.email).toBe(newUser.email);
      expect(response.body).toHaveProperty('_id');
      
      // ✅ Password debe estar hasheado (bcrypt)
      expect(response.body.password).not.toBe(newUser.password);
      expect(response.body.password).toMatch(/^\$2[aby]\$/); // bcrypt pattern
    });

    it('debe validar email requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send({ password: 'password123' })
        .expect(400);

      // Joi validation error
      expect(response.body.message).toContain('email');
    });

    it('debe validar formato de email (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send({ 
          email: 'invalid-email', 
          password: 'password123' 
        })
        .expect(400);

      expect(response.body.message).toContain('valid email');
    });

    it('debe validar password requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('debe rechazar email duplicado (Mongoose unique)', async () => {
      // Crear primer usuario
      await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send({ 
          email: 'test@example.com', 
          password: 'password123' 
        });

      // Intentar crear segundo usuario con mismo email
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send({ 
          email: 'test@example.com', 
          password: 'password456' 
        })
        .expect(500); // Mongoose duplicate key error

      expect(response.body.message).toContain('duplicate');
    });
  });

  // ==================== DELETE /v1/users/:id ====================
  
  describe('DELETE /v1/users/:id', () => {
    it('debe eliminar usuario existente', async () => {
      // Crear usuario
      const [user] = await seedUsers([
        { email: 'delete@test.com', password: 'password123' }
      ]);

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

    it('debe retornar 404 si usuario no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/v1/users/${fakeId}`)
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('debe validar ID de MongoDB', async () => {
      const response = await request(app)
        .delete('/v1/users/invalid-id')
        .set('Accept', 'application/json')
        .expect(400);

      expect(response.body.message).toContain('Cast to ObjectId failed');
    });
  });
});