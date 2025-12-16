import request from 'supertest';
import mongoose from 'mongoose';
import { validProject, invalidProjects } from '../../tests/fixtures/projects';
import { buildProject, resetProjectFactory } from '../../tests/factories/projectFactory';

describe('Projects API Integration Tests', () => {
  let app: any;
  let clearDatabase: any;
  let dbConnection: any;
  let ProjectModel: any;

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Configurar variables de entorno para que la app use la base de datos en memoria
    process.env.MONGODB_URI = process.env.MONGO_URI!;
    process.env.MONGODB_DB_MAIN = '';

    // Resetear modulos para recargar la configuracion con las nuevas variables de entorno
    jest.resetModules();

    // Mock auth middleware to bypass authentication
    jest.doMock('../../config/middleware/jwtAuth', () => ({
      isAuthenticated: (req: any, res: any, next: any) => next()
    }));

    // Importar app y helpers dinamicamente
    app = require('../../config/server/server').default;
    const dbHelper = require('../../tests/db-helper');
    clearDatabase = dbHelper.clearDatabase;

    // Obtener la conexion de la base de datos para cerrarla despues
    dbConnection = require('../../config/connection/connection').db;
    ProjectModel = require('../../components/Projects/model').default;
  });

  // Limpiar base de datos antes de cada test
  beforeEach(async () => {
    await clearDatabase();
    resetProjectFactory();
  });

  // Cerrar conexion despues de todos los tests
  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close();
    }
    await mongoose.connection.close();
  });

  // ==================== GET /v1/projects/:id ====================

  describe('GET /v1/projects/:id', () => {
    it('debe retornar 200 con datos del proyecto existente', async () => {
      // Arrange: Crear un proyecto usando factory
      const projectData = buildProject({
        title: 'Test Project',
        description: 'Test Description'
      });

      const createdProject = await ProjectModel.create({
        title: projectData.title,
        description: projectData.description,
        version: projectData.version,
        link: projectData.link,
        tag: projectData.tag,
        timestamp: projectData.timestamp
      });

      // Act
      const response = await request(app)
        .get(`/v1/projects/${createdProject._id}`)
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body._id).toBe(createdProject._id.toString());
      expect(response.body.title).toBe('Test Project');
      expect(response.body.description).toBe('Test Description');
    });

    it('debe retornar 404 para proyecto inexistente', async () => {
      // Arrange: ID valido pero no existe en DB
      const fakeId = new mongoose.Types.ObjectId();

      // Act
      const response = await request(app)
        .get(`/v1/projects/${fakeId}`)
        .set('Accept', 'application/json')
        .expect(404);

      // Assert
      expect(response.body.message).toBe('Project not found');
    });

    it('debe retornar 400 para ID invalido de MongoDB', async () => {
      // Act
      const response = await request(app)
        .get('/v1/projects/invalid-id')
        .set('Accept', 'application/json')
        .expect(400);

      // Assert - El mensaje puede ser sobre "12 bytes" o "24 hex characters"
      expect(response.body.message).toMatch(/12 bytes|24 hex characters/);
    });
  });

  // ==================== POST /v1/projects ====================

  describe('POST /v1/projects', () => {
    it('debe retornar 201 y crear proyecto con datos validos', async () => {
      // Arrange: Usando fixture para datos de proyecto valido
      const response = await request(app)
        .post('/v1/projects')
        .set('Accept', 'application/json')
        .send(validProject)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(validProject.title);
      expect(response.body.description).toBe(validProject.description);

      // Verificar que el proyecto se creo en la DB
      const projectInDb = await ProjectModel.findById(response.body._id);
      expect(projectInDb).not.toBeNull();
      expect(projectInDb.title).toBe(validProject.title);
    });

    it('debe retornar 400 para datos invalidos (sin title)', async () => {
      // Arrange: Usando fixture para proyecto invalido (sin title)
      const response = await request(app)
        .post('/v1/projects')
        .set('Accept', 'application/json')
        .send(invalidProjects.noTitle)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('title');
    });

    it('debe crear proyecto con factory y verificar estructura', async () => {
      // Arrange: Usando factory para generar proyecto
      const projectData = buildProject({
        title: 'Factory Project',
        tag: 'test'
      });

      // Remover _id generado por factory ya que MongoDB lo genera
      const { _id, ...projectWithoutId } = projectData;

      const response = await request(app)
        .post('/v1/projects')
        .set('Accept', 'application/json')
        .send(projectWithoutId)
        .expect(201);

      // Assert
      expect(response.body.title).toBe('Factory Project');
      expect(response.body.tag).toBe('test');
      expect(response.body).toHaveProperty('_id');
    });
  });

  // ==================== GET /v1/projects ====================

  describe('GET /v1/projects', () => {
    it('debe retornar array vacio inicialmente', async () => {
      const response = await request(app)
        .get('/v1/projects')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar todos los proyectos ordenados por timestamp', async () => {
      // Arrange: Crear multiples proyectos usando factory
      const project1 = buildProject({ title: 'Project 1', timestamp: 1000 });
      const project2 = buildProject({ title: 'Project 2', timestamp: 2000 });

      await ProjectModel.create([
        {
          title: project1.title,
          description: project1.description,
          version: project1.version,
          link: project1.link,
          tag: project1.tag,
          timestamp: project1.timestamp
        },
        {
          title: project2.title,
          description: project2.description,
          version: project2.version,
          link: project2.link,
          tag: project2.tag,
          timestamp: project2.timestamp
        }
      ]);

      // Act
      const response = await request(app)
        .get('/v1/projects')
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      // Verificar orden por timestamp ascendente
      expect(response.body[0].timestamp).toBeLessThan(response.body[1].timestamp);
    });
  });

  // ==================== DELETE /v1/projects ====================

  describe('DELETE /v1/projects', () => {
    it('debe eliminar proyecto existente', async () => {
      // Arrange: Crear proyecto
      const project = await ProjectModel.create({
        title: 'To Delete',
        description: 'Will be deleted',
        version: '1.0.0',
        link: 'https://github.com/test',
        tag: 'test',
        timestamp: Date.now()
      });

      // Act
      await request(app)
        .delete('/v1/projects')
        .set('Accept', 'application/json')
        .send({ id: project._id.toString() })
        .expect(200);

      // Assert: Verificar que ya no existe
      const deletedProject = await ProjectModel.findById(project._id);
      expect(deletedProject).toBeNull();
    });
  });

  // ==================== PUT /v1/projects ====================

  describe('PUT /v1/projects', () => {
    it('debe actualizar proyecto existente', async () => {
      // Arrange: Crear proyecto
      const project = await ProjectModel.create({
        title: 'Original Title',
        description: 'Original Description',
        version: '1.0.0',
        link: 'https://github.com/test',
        tag: 'test',
        timestamp: Date.now()
      });

      // Act
      const response = await request(app)
        .put('/v1/projects')
        .set('Accept', 'application/json')
        .send({
          _id: project._id.toString(),
          title: 'Updated Title',
          description: 'Updated Description',
          version: '2.0.0',
          link: 'https://github.com/updated',
          tag: 'updated',
          timestamp: Date.now()
        })
        .expect(201);

      // Assert
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });
  });
});
