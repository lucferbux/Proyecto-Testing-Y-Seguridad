import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { SecureUser } from '../models/user.model';
import {
  authenticate,
  authorize,
  generateSecureToken,
  verifyOwnership,
  AuthRequest,
} from '../middleware/auth.middleware';
import { loginLimiter, registerLimiter, strictLimiter } from '../middleware/rate-limiter';
import { validateLoginInput } from '../middleware/sanitizer';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  objectIdSchema,
  validate,
} from '../validators/auth.validator';

// ✅ SEGURO - Rutas con todas las protecciones

const router = Router();

// ========================================
// 1. LOGIN - Protegido contra ataques
// ========================================
router.post(
  '/login',
  loginLimiter, // ✅ Rate limiting (5 intentos/15min)
  validateLoginInput, // ✅ Validar tipos de datos
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ Validacion con Joi
      const { error, value } = validate<{ email: string; password: string }>(loginSchema, req.body);

      if (error) {
        // ✅ Mensaje generico para no revelar detalles
        return res.status(400).json({ error: 'Credenciales invalidas' });
      }

      const { email, password } = value!;

      // ✅ Incluir password en la consulta (select: false por defecto)
      const user = await SecureUser.findOne({ email }).select('+password');

      // ✅ Comparacion en tiempo constante para evitar timing attacks
      // Siempre ejecutar bcrypt.compare aunque el usuario no exista
      const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.00';
      const passwordToCompare = user?.password || dummyHash;
      const isValidPassword = await bcrypt.compare(password, passwordToCompare);

      if (!user || !isValidPassword) {
        // ✅ Mensaje generico - no revelar si el email existe
        return res.status(401).json({ error: 'Credenciales invalidas' });
      }

      // ✅ Generar token seguro
      const token = generateSecureToken(user._id.toString(), user.role);

      // ✅ Respuesta sin datos sensibles
      res.json({
        token,
        expiresIn: 3600, // 1 hora
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          // ✅ Sin password
        },
      });
    } catch (err) {
      // ✅ Error generico sin detalles
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 2. REGISTER - Con validacion completa
// ========================================
router.post(
  '/register',
  registerLimiter, // ✅ Rate limiting (10/hora)
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ Validacion estricta con Joi
      const { error, value } = validate<{ username: string; email: string; password: string }>(
        registerSchema,
        req.body
      );

      if (error) {
        return res.status(400).json({ error: 'Datos invalidos' });
      }

      const { username, email, password } = value!;

      // ✅ Verificar email unico (sin revelar si existe)
      const existingUser = await SecureUser.findOne({ email });
      if (existingUser) {
        // ✅ Mensaje generico para evitar enumeracion
        return res.status(400).json({ error: 'No se pudo completar el registro' });
      }

      // ✅ Crear usuario con campos explicitos (NO mass assignment)
      const user = new SecureUser({
        username,
        email,
        password, // Se hashea automaticamente en pre-save hook
        role: 'user', // ✅ Rol hardcodeado, no del request
      });

      await user.save();

      // ✅ Respuesta sin password
      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 3. SEARCH - Retorna JSON, no HTML
// ========================================
router.get('/search', (req: AuthRequest, res: Response) => {
  const query = req.query.q;

  // ✅ Validar que sea string
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Parametro de busqueda invalido' });
  }

  // ✅ Retornar JSON en lugar de HTML (previene XSS)
  res.json({
    query: query,
    message: `Resultados para: ${query}`,
    results: [],
  });
});

// ========================================
// 4. GET USERS - Solo admin
// ========================================
router.get(
  '/users',
  authenticate, // ✅ Requiere autenticacion
  authorize('admin'), // ✅ Solo admin
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ No aceptar query params directamente (previene NoSQL injection)
      const users = await SecureUser.find({}).select('-password');

      res.json(users);
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 5. GET USER BY ID - Con verificacion de ownership
// ========================================
router.get(
  '/users/:id',
  authenticate, // ✅ Requiere autenticacion
  verifyOwnership, // ✅ Solo el propio usuario o admin
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ Validar formato de ID
      const { error } = objectIdSchema.validate(req.params.id);
      if (error) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const user = await SecureUser.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 6. UPDATE USER - Sin mass assignment
// ========================================
router.put(
  '/users/:id',
  authenticate, // ✅ Requiere autenticacion
  verifyOwnership, // ✅ Solo el propio usuario o admin
  strictLimiter, // ✅ Rate limiting estricto
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ Validar ID
      const { error: idError } = objectIdSchema.validate(req.params.id);
      if (idError) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      // ✅ Validar campos permitidos
      const { error, value } = validate<{ username?: string; email?: string }>(
        updateUserSchema,
        req.body
      );

      if (error) {
        return res.status(400).json({ error: 'Datos invalidos' });
      }

      // ✅ Solo actualizar campos permitidos (NO role, NO password directo)
      const updateData: { username?: string; email?: string } = {};

      if (value?.username) updateData.username = value.username;
      if (value?.email) updateData.email = value.email;

      const user = await SecureUser.findByIdAndUpdate(
        req.params.id,
        updateData, // ✅ Solo campos validados
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 7. DELETE USER - Con autorizacion
// ========================================
router.delete(
  '/users/:id',
  authenticate, // ✅ Requiere autenticacion
  verifyOwnership, // ✅ Solo el propio usuario o admin
  strictLimiter, // ✅ Rate limiting estricto
  async (req: AuthRequest, res: Response) => {
    try {
      // ✅ Validar ID
      const { error } = objectIdSchema.validate(req.params.id);
      if (error) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const user = await SecureUser.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ success: true, message: 'Usuario eliminado' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========================================
// 8. ADMIN ENDPOINT - Solo admin
// ========================================
router.get(
  '/admin/users',
  authenticate, // ✅ Requiere autenticacion
  authorize('admin'), // ✅ Solo rol admin
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await SecureUser.find({});

      res.json({
        total: users.length,
        users,
      });
    } catch (err) {
      console.error('Admin users error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

export default router;
