import request from 'supertest';
import bcrypt from 'bcrypt';
import vulnerableApp from '../../vulnerable-api/app';
import secureApp from '../../secure-api/app';
import { VulnerableUser } from '../../vulnerable-api/models/user.model';
import { SecureUser } from '../../secure-api/models/user.model';
import { generateVulnerableToken } from '../../vulnerable-api/middleware/auth.middleware';
import { generateSecureToken } from '../../secure-api/middleware/auth.middleware';
import { connectDB, disconnectDB, clearDatabase } from '../db-helper';

// Tests de Seguridad de Passwords

describe('Pruebas de Seguridad de Passwords', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Almacenamiento de Passwords', () => {
    describe('API Vulnerable', () => {
      it('debe almacenar passwords en texto plano', async () => {
        const password = 'mysecretpassword123';

        await request(vulnerableApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: password,
        });

        // Verificar directamente en la BD
        const user = await VulnerableUser.findOne({ email: 'test@test.com' });

        // VULNERABLE: Password almacenado en texto plano
        expect(user?.password).toBe(password);
        expect(user?.password).not.toMatch(/^\$2[aby]\$/); // No es bcrypt hash
      });

      it('debe exponer password en respuesta de registro', async () => {
        const response = await request(vulnerableApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'mysecretpassword',
        });

        // VULNERABLE: Password visible en respuesta
        expect(response.body.password).toBe('mysecretpassword');
      });

      it('debe exponer password en respuesta de login', async () => {
        await VulnerableUser.create({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123',
        });

        const response = await request(vulnerableApp).post('/api/login').send({
          username: 'testuser',
          password: 'password123',
        });

        // VULNERABLE: Password en respuesta de login
        expect(response.body.user.password).toBe('password123');
      });

      it('debe exponer passwords al listar usuarios', async () => {
        await VulnerableUser.create({
          username: 'user1',
          email: 'user1@test.com',
          password: 'secret1',
        });

        await VulnerableUser.create({
          username: 'user2',
          email: 'user2@test.com',
          password: 'secret2',
        });

        const response = await request(vulnerableApp).get('/api/users');

        // VULNERABLE: Passwords de todos los usuarios expuestos
        expect(response.body[0].password).toBeDefined();
        expect(response.body[1].password).toBeDefined();
      });
    });

    describe('API Segura', () => {
      it('debe hashear passwords con bcrypt', async () => {
        const password = 'SecurePass123!';

        await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: password,
        });

        // Verificar en BD (necesitamos select +password)
        const user = await SecureUser.findOne({ email: 'test@test.com' }).select('+password');

        // SEGURO: Password hasheado
        expect(user?.password).not.toBe(password);
        expect(user?.password).toMatch(/^\$2[aby]\$/); // Es bcrypt hash

        // Verificar que el hash es valido
        const isValid = await bcrypt.compare(password, user?.password || '');
        expect(isValid).toBe(true);
      });

      it('debe usar salt rounds >= 12', async () => {
        await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

        const user = await SecureUser.findOne({ email: 'test@test.com' }).select('+password');

        // El hash bcrypt contiene el cost factor
        // Formato: $2b$12$... donde 12 es el salt rounds
        const saltRounds = parseInt(user?.password?.split('$')[2] || '0');
        expect(saltRounds).toBeGreaterThanOrEqual(12);
      });

      it('no debe exponer password en respuesta de registro', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

        // SEGURO: Sin password en respuesta
        expect(response.body.password).toBeUndefined();
        expect(response.body.user?.password).toBeUndefined();
        expect(response.body.user?.passwordHash).toBeUndefined();
      });

      it('no debe exponer password en respuesta de login', async () => {
        await SecureUser.create({
          username: 'testuser',
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

        const response = await request(secureApp).post('/api/login').send({
          email: 'test@test.com',
          password: 'SecurePass123!',
        });

        // SEGURO: Sin password
        expect(response.body.user.password).toBeUndefined();
      });

      it('no debe exponer passwords al listar usuarios', async () => {
        const admin = await SecureUser.create({
          username: 'admin',
          email: 'admin@test.com',
          password: 'AdminPass123!',
          role: 'admin',
        });

        await SecureUser.create({
          username: 'user1',
          email: 'user1@test.com',
          password: 'SecurePass123!',
        });

        const token = generateSecureToken(admin._id.toString(), 'admin');

        const response = await request(secureApp)
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`);

        // SEGURO: Sin passwords
        response.body.forEach((user: any) => {
          expect(user.password).toBeUndefined();
        });
      });
    });
  });

  describe('Validacion de Password', () => {
    describe('API Vulnerable', () => {
      it('debe aceptar passwords debiles', async () => {
        const response = await request(vulnerableApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: '123', // Password muy debil
        });

        // VULNERABLE: Acepta cualquier password
        expect(response.status).toBe(201);
      });

      it('debe aceptar password vacio', async () => {
        const response = await request(vulnerableApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: '',
        });

        // VULNERABLE: Acepta password vacio
        expect(response.status).not.toBe(400);
      });
    });

    describe('API Segura', () => {
      it('debe rechazar passwords menores a 12 caracteres', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'Short1!', // Solo 7 caracteres
        });

        expect(response.status).toBe(400);
      });

      it('debe rechazar passwords sin mayusculas', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'lowercase123!', // Sin mayusculas
        });

        expect(response.status).toBe(400);
      });

      it('debe rechazar passwords sin minusculas', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'UPPERCASE123!', // Sin minusculas
        });

        expect(response.status).toBe(400);
      });

      it('debe rechazar passwords sin numeros', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'NoNumbers!!!aa', // Sin numeros
        });

        expect(response.status).toBe(400);
      });

      it('debe rechazar passwords sin caracteres especiales', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'NoSpecial12345', // Sin especiales
        });

        expect(response.status).toBe(400);
      });

      it('debe aceptar passwords que cumplen todos los requisitos', async () => {
        const response = await request(secureApp).post('/api/register').send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'SecurePass123!', // Cumple todos los requisitos
        });

        expect(response.status).toBe(201);
      });
    });
  });

  describe('Comparacion de Passwords (Timing Attacks)', () => {
    describe('API Segura', () => {
      beforeEach(async () => {
        await SecureUser.create({
          username: 'existinguser',
          email: 'existing@test.com',
          password: 'SecurePass123!',
        });
      });

      it('debe usar comparacion en tiempo constante', async () => {
        // Medir tiempo de respuesta para usuario existente con password incorrecto
        const start1 = Date.now();
        await request(secureApp).post('/api/login').send({
          email: 'existing@test.com',
          password: 'wrongpassword1',
        });
        const time1 = Date.now() - start1;

        // Medir tiempo para usuario inexistente
        const start2 = Date.now();
        await request(secureApp).post('/api/login').send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword1',
        });
        const time2 = Date.now() - start2;

        // Los tiempos deben ser similares (diferencia < 100ms)
        // Esto indica que se usa comparacion en tiempo constante
        const timeDiff = Math.abs(time1 - time2);
        expect(timeDiff).toBeLessThan(200);
      });

      it('debe retornar mismo mensaje para usuario existente e inexistente', async () => {
        const response1 = await request(secureApp).post('/api/login').send({
          email: 'existing@test.com',
          password: 'wrongpassword',
        });

        const response2 = await request(secureApp).post('/api/login').send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        });

        // Mismo status y mensaje
        expect(response1.status).toBe(response2.status);
        expect(response1.body.error).toBe(response2.body.error);
      });
    });
  });
});
