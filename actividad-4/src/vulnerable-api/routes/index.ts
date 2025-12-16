import { Router, Request, Response } from 'express';
import { VulnerableUser, IUser } from '../models/user.model';
import {
  vulnerableAuthenticate,
  generateVulnerableToken,
  AuthRequest,
} from '../middleware/auth.middleware';

// ❌ VULNERABLE - NO USAR EN PRODUCCION

const router = Router();

// ========================================
// 1. LOGIN - Vulnerable a NoSQL Injection
// ========================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // ❌ CRITICO: Vulnerable a NoSQL Injection
    // Payload malicioso: { username: { $ne: null }, password: { $ne: null } }
    const user = await VulnerableUser.findOne({
      username: username,
      password: password, // ❌ Comparacion directa sin hash
    });

    if (user) {
      // ❌ Secret debil hardcodeado
      const token = generateVulnerableToken(user._id.toString(), user.role);

      // ❌ Retorna informacion sensible
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          password: user.password, // ❌ CRITICO: Expone password
        },
      });
    } else {
      // ❌ User enumeration: mensaje diferente para usuario no encontrado
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err: any) {
    // ❌ Expone detalles del error
    res.status(500).json({
      error: err.message,
      stack: err.stack, // ❌ CRITICO: Stack trace expuesto
    });
  }
});

// ========================================
// 2. REGISTER - Sin validacion, Mass Assignment
// ========================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    // ❌ CRITICO: Mass Assignment - acepta cualquier campo del body
    // Un atacante puede enviar: { username: "test", password: "123", role: "admin" }
    const user = new VulnerableUser(req.body);

    await user.save();

    // ❌ CRITICO: Expone toda la informacion incluyendo password
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
});

// ========================================
// 3. SEARCH - Vulnerable a XSS Reflejado
// ========================================
router.get('/search', (req: Request, res: Response) => {
  const query = req.query.q;

  // ❌ CRITICO: XSS Reflejado - renderiza HTML con input del usuario
  // Payload malicioso: ?q=<script>alert('XSS')</script>
  res.send(`<h1>Results for: ${query}</h1>`);
});

// ========================================
// 4. GET USERS - Sin autorizacion
// ========================================
router.get('/users', async (req: Request, res: Response) => {
  try {
    // ❌ CRITICO: NoSQL Injection via query params
    // Payload: ?email[$ne]=null
    const users = await VulnerableUser.find(req.query as any);

    // ❌ Expone passwords de todos los usuarios
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ========================================
// 5. GET USER BY ID - IDOR
// ========================================
router.get('/users/:id', vulnerableAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await VulnerableUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ❌ IDOR: No verifica que el usuario autenticado es el dueno del recurso
    // Cualquier usuario autenticado puede ver datos de otros usuarios
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ========================================
// 6. UPDATE USER - Mass Assignment + IDOR
// ========================================
router.put('/users/:id', vulnerableAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    // ❌ IDOR: No verifica ownership
    // ❌ Mass Assignment: permite actualizar cualquier campo incluyendo role
    const user = await VulnerableUser.findByIdAndUpdate(
      req.params.id,
      req.body, // ❌ CRITICO: Acepta todo el body
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ========================================
// 7. DELETE USER - Sin verificacion de autorizacion
// ========================================
router.delete('/users/:id', vulnerableAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    // ❌ CRITICO: Cualquier usuario autenticado puede eliminar cualquier cuenta
    // No hay verificacion de que sea admin o el propio usuario
    await VulnerableUser.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ========================================
// 8. ADMIN ENDPOINT - Sin verificacion de rol
// ========================================
router.get('/admin/users', vulnerableAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    // ❌ CRITICO: No verifica que el usuario sea admin
    // Cualquier usuario autenticado puede acceder a endpoints admin
    const users = await VulnerableUser.find({});

    res.json({
      total: users.length,
      users,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
