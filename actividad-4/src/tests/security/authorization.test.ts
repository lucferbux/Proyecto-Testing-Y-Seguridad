import request from 'supertest';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';
import { VulnerableUser } from '../../vulnerable-api/models/user.model';
import { SecureUser } from '../../secure-api/models/user.model';
import { generateVulnerableToken } from '../../vulnerable-api/middleware/auth.middleware';
import { generateSecureToken } from '../../secure-api/middleware/auth.middleware';
import { connectDB, disconnectDB, clearDatabase } from '../db-helper';

// Tests de Autorizacion (IDOR, Access Control, Mass Assignment)

describe('Pruebas de Autorizacion y Control de Acceso', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('IDOR - Insecure Direct Object Reference', () => {
    describe('API Vulnerable', () => {
      let userAId: string;
      let userBId: string;
      let tokenUserA: string;

      beforeEach(async () => {
        const userA = await VulnerableUser.create({
          username: 'userA',
          email: 'userA@test.com',
          password: 'password123',
          role: 'user',
        });

        const userB = await VulnerableUser.create({
          username: 'userB',
          email: 'userB@test.com',
          password: 'password456',
          role: 'user',
        });

        userAId = userA._id.toString();
        userBId = userB._id.toString();
        tokenUserA = generateVulnerableToken(userAId, 'user');
      });

      it('debe permitir a Usuario A ver datos de Usuario B (IDOR)', async () => {
        const response = await request(vulnerableApp)
          .get(`/api/users/${userBId}`)
          .set('Authorization', tokenUserA);

        // VULNERABLE: Usuario A puede ver datos de Usuario B
        expect(response.status).toBe(200);
        expect(response.body._id.toString()).toBe(userBId);
      });

      it('debe permitir a Usuario A modificar datos de Usuario B (IDOR)', async () => {
        const response = await request(vulnerableApp)
          .put(`/api/users/${userBId}`)
          .set('Authorization', tokenUserA)
          .send({ email: 'hacked@attacker.com' });

        // VULNERABLE: Usuario A puede modificar Usuario B
        expect(response.status).toBe(200);
        expect(response.body.email).toBe('hacked@attacker.com');
      });

      it('debe permitir a Usuario A eliminar cuenta de Usuario B (IDOR)', async () => {
        const response = await request(vulnerableApp)
          .delete(`/api/users/${userBId}`)
          .set('Authorization', tokenUserA);

        // VULNERABLE: Usuario A puede eliminar Usuario B
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verificar que fue eliminado
        const deleted = await VulnerableUser.findById(userBId);
        expect(deleted).toBeNull();
      });
    });

    describe('API Segura', () => {
      let userAId: string;
      let userBId: string;
      let tokenUserA: string;
      let tokenAdmin: string;

      beforeEach(async () => {
        const userA = await SecureUser.create({
          username: 'userA',
          email: 'userA@test.com',
          password: 'SecurePass123!',
          role: 'user',
        });

        const userB = await SecureUser.create({
          username: 'userB',
          email: 'userB@test.com',
          password: 'SecurePass456!',
          role: 'user',
        });

        const admin = await SecureUser.create({
          username: 'admin',
          email: 'admin@test.com',
          password: 'AdminPass123!',
          role: 'admin',
        });

        userAId = userA._id.toString();
        userBId = userB._id.toString();
        tokenUserA = generateSecureToken(userAId, 'user');
        tokenAdmin = generateSecureToken(admin._id.toString(), 'admin');
      });

      it('debe denegar a Usuario A ver datos de Usuario B', async () => {
        const response = await request(secureApp)
          .get(`/api/users/${userBId}`)
          .set('Authorization', `Bearer ${tokenUserA}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Acceso denegado');
      });

      it('debe denegar a Usuario A modificar datos de Usuario B', async () => {
        const response = await request(secureApp)
          .put(`/api/users/${userBId}`)
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send({ email: 'hacked@attacker.com' });

        expect(response.status).toBe(403);
      });

      it('debe denegar a Usuario A eliminar cuenta de Usuario B', async () => {
        const response = await request(secureApp)
          .delete(`/api/users/${userBId}`)
          .set('Authorization', `Bearer ${tokenUserA}`);

        expect(response.status).toBe(403);

        // Verificar que NO fue eliminado
        const stillExists = await SecureUser.findById(userBId);
        expect(stillExists).not.toBeNull();
      });

      it('debe permitir a Usuario A ver sus propios datos', async () => {
        const response = await request(secureApp)
          .get(`/api/users/${userAId}`)
          .set('Authorization', `Bearer ${tokenUserA}`);

        expect(response.status).toBe(200);
        expect(response.body._id.toString()).toBe(userAId);
      });

      it('debe permitir a Admin ver datos de cualquier usuario', async () => {
        const response = await request(secureApp)
          .get(`/api/users/${userBId}`)
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Mass Assignment', () => {
    describe('API Vulnerable', () => {
      it('debe permitir escalada de privilegios via role en registro', async () => {
        const response = await request(vulnerableApp)
          .post('/api/register')
          .send({
            username: 'attacker',
            email: 'attacker@test.com',
            password: 'password123',
            role: 'admin', // Intentando escalada de privilegios
          });

        expect(response.status).toBe(201);
        // VULNERABLE: El rol admin fue asignado
        expect(response.body.role).toBe('admin');
      });

      it('debe permitir modificar role en actualizacion', async () => {
        const user = await VulnerableUser.create({
          username: 'user',
          email: 'user@test.com',
          password: 'password',
          role: 'user',
        });

        const token = generateVulnerableToken(user._id.toString(), 'user');

        const response = await request(vulnerableApp)
          .put(`/api/users/${user._id}`)
          .set('Authorization', token)
          .send({ role: 'admin' });

        expect(response.status).toBe(200);
        // VULNERABLE: Escalada de privilegios exitosa
        expect(response.body.role).toBe('admin');
      });
    });

    describe('API Segura', () => {
      it('debe ignorar role en registro (siempre asigna user)', async () => {
        const response = await request(secureApp)
          .post('/api/register')
          .send({
            username: 'attacker',
            email: 'attacker@test.com',
            password: 'SecurePass123!',
            role: 'admin', // Intento de escalada
          });

        expect(response.status).toBe(201);
        // SEGURO: El rol siempre es 'user'
        expect(response.body.user.role).toBe('user');
      });

      it('debe ignorar role en actualizacion', async () => {
        const user = await SecureUser.create({
          username: 'user',
          email: 'user@test.com',
          password: 'SecurePass123!',
          role: 'user',
        });

        const token = generateSecureToken(user._id.toString(), 'user');

        const response = await request(secureApp)
          .put(`/api/users/${user._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ role: 'admin' });

        expect(response.status).toBe(200);
        // SEGURO: El rol no cambio
        expect(response.body.role).toBe('user');
      });

      it('debe solo permitir campos especificos en actualizacion', async () => {
        const user = await SecureUser.create({
          username: 'user',
          email: 'user@test.com',
          password: 'SecurePass123!',
          role: 'user',
        });

        const token = generateSecureToken(user._id.toString(), 'user');

        const response = await request(secureApp)
          .put(`/api/users/${user._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            username: 'newusername',
            role: 'admin',
            _id: 'fake-id',
            createdAt: new Date(),
          });

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('newusername');
        expect(response.body.role).toBe('user'); // No cambio
        expect(response.body._id.toString()).toBe(user._id.toString()); // No cambio
      });
    });
  });

  describe('Broken Access Control - Admin Endpoints', () => {
    describe('API Vulnerable', () => {
      it('debe permitir acceso a endpoint admin sin verificar rol', async () => {
        const user = await VulnerableUser.create({
          username: 'regularuser',
          email: 'user@test.com',
          password: 'password',
          role: 'user', // Usuario normal, no admin
        });

        const token = generateVulnerableToken(user._id.toString(), 'user');

        const response = await request(vulnerableApp)
          .get('/api/admin/users')
          .set('Authorization', token);

        // VULNERABLE: Usuario normal accede a endpoint admin
        expect(response.status).toBe(200);
        expect(response.body.users).toBeDefined();
      });
    });

    describe('API Segura', () => {
      it('debe denegar acceso a endpoint admin para usuarios normales', async () => {
        const user = await SecureUser.create({
          username: 'regularuser',
          email: 'user@test.com',
          password: 'SecurePass123!',
          role: 'user',
        });

        const token = generateSecureToken(user._id.toString(), 'user');

        const response = await request(secureApp)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Acceso denegado');
      });

      it('debe permitir acceso a endpoint admin solo para admins', async () => {
        const admin = await SecureUser.create({
          username: 'admin',
          email: 'admin@test.com',
          password: 'AdminPass123!',
          role: 'admin',
        });

        const token = generateSecureToken(admin._id.toString(), 'admin');

        const response = await request(secureApp)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.users).toBeDefined();
      });

      it('debe requerir autenticacion para endpoints admin', async () => {
        const response = await request(secureApp).get('/api/admin/users');

        expect(response.status).toBe(401);
      });
    });
  });
});
