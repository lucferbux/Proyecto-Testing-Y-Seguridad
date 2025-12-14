import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { invalidProjects } from '@/tests/fixtures/projects';
import { buildProject, resetProjectFactory } from '@/tests/factories/projectFactory';
import { validUser, invalidUsers } from '@/tests/fixtures/users';

describe('ProjectsRouter API (MongoDB Memory Server)', () => {
  let app: any;
  let clearDatabase: any;
  let dbConnection: any;
  let ProjectModel: any;
  let UserModel: any;

  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.MONGO_URI!;
    process.env.MONGODB_DB_MAIN = '';

    jest.resetModules();

    jest.doMock('../../config/middleware/jwtAuth', () => ({
      isAuthenticated: (req: any, res: any, next: any) => next()
    }));

    app = require('../../config/server/server').default;
    clearDatabase = require('../../tests/db-helper').clearDatabase;

    ProjectModel = require('../../components/Projects/model').default;
    UserModel = require('../../components/User/model').default;

    dbConnection = require('../../config/connection/connection').db;
  });

  beforeEach(async () => {
    resetProjectFactory();
    await clearDatabase();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close();
    }
    await mongoose.connection.close();
  });

  describe('GET /v1/projects/:id', () => {
    it('Proyecto existente: devuelve 200 y datos correctos', async () => {
      const created = await ProjectModel.create(buildProject({ title: 'Existing Project' }));

      const response = await request(app)
        .get(`/v1/projects/${created._id}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body._id).toBe(String(created._id));
      expect(response.body.title).toBe('Existing Project');
    });

    it('Proyecto inexistente: devuelve 404 y mensaje de error', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/v1/projects/${fakeId}`)
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.message).toBe('Project not found');
    });
  });

  describe('POST /v1/projects', () => {
    it('Crear proyecto válido: devuelve 201 y se crea en la DB', async () => {
      const payload = buildProject({ title: 'Created via API' });

      const response = await request(app)
        .post('/v1/projects')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(201);

      expect(response.body._id).toBeDefined();
      expect(response.body.title).toBe('Created via API');

      const inDb = await ProjectModel.findById(response.body._id);
      expect(inDb).not.toBeNull();
      expect(inDb.title).toBe('Created via API');
    });

    it('Datos inválidos: devuelve 400 y mensaje de validación', async () => {
      const response = await request(app)
        .post('/v1/projects')
        .set('Accept', 'application/json')
        .send(invalidProjects.noTitle)
        .expect(400);

      expect(String(response.body.message)).toContain('title');
    });
  });

  // Extra (from the assignment text): hashed password + invalid user payload
  describe('POST /v1/users', () => {
    it('Crear usuario válido: el password queda hasheado', async () => {
      const payload = { ...validUser, email: 'hash@test.com', password: 'PlainPassword123!' };

      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(201);

      const userInDb = await UserModel.findById(response.body._id).select('+password');

      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe(payload.password);

      const matches = await bcrypt.compare(payload.password, userInDb.password);
      expect(matches).toBe(true);
    });

    it('Datos inválidos: devuelve 400 y mensaje de validación', async () => {
      const response = await request(app)
        .post('/v1/users')
        .set('Accept', 'application/json')
        .send(invalidUsers.noEmail)
        .expect(400);

      expect(String(response.body.message)).toContain('email');
    });
  });
});
