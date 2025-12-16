import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ SEGURO - Middleware de autenticacion robusto

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

// ✅ Obtener secret de variable de entorno
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return secret;
}

// ✅ Middleware de autenticacion
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Validar formato Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token || token.trim() === '') {
      res.status(401).json({ error: 'Token invalido' });
      return;
    }

    // ✅ Verificacion estricta con algoritmo especifico
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'], // ✅ Solo permitir HS256
      issuer: 'actividad-4-secure-api', // ✅ Validar issuer
      complete: false,
    }) as JwtPayload;

    // ✅ Validar estructura del payload
    if (!decoded.userId || !decoded.role) {
      res.status(401).json({ error: 'Token malformado' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token invalido' });
      return;
    }

    // Error generico para no exponer detalles
    res.status(401).json({ error: 'Error de autenticacion' });
  }
}

// ✅ Middleware de autorizacion por roles
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }

    next();
  };
}

// ✅ Generar token seguro
export function generateSecureToken(userId: string, role: string): string {
  return jwt.sign(
    {
      userId,
      role,
    },
    getJwtSecret(),
    {
      expiresIn: '1h', // ✅ Expiracion corta (1 hora)
      algorithm: 'HS256', // ✅ Algoritmo explicito
      issuer: 'actividad-4-secure-api', // ✅ Issuer para validacion
    }
  );
}

// ✅ Verificar ownership (usuario accede a sus propios recursos)
export function verifyOwnership(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const resourceUserId = req.params.id;

  // Admin puede acceder a cualquier recurso
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Usuario solo puede acceder a sus propios recursos
  if (req.user.userId !== resourceUserId) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  next();
}
