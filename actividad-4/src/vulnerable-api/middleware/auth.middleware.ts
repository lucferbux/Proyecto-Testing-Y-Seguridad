import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ❌ VULNERABLE - NO USAR EN PRODUCCION
// Vulnerabilidades:
// 1. Secret debil y hardcodeado
// 2. Acepta algoritmo "none"
// 3. No valida expiracion
// 4. No verifica estructura del token

// ❌ CRITICO: Secret hardcodeado y debil
const JWT_SECRET = 'secret';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function vulnerableAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // ❌ Extrae token sin validar formato Bearer
  const token = req.headers.authorization;

  if (!token) {
    // ❌ Permite continuar sin token en algunos casos
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ❌ CRITICO: No especifica algoritmos permitidos
    // Esto permite "algorithm confusion" attack
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // ❌ No valida estructura del payload
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    // ❌ Error generico sin logging
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ❌ Funcion para generar tokens vulnerables
export function generateVulnerableToken(userId: string, role: string = 'user'): string {
  // ❌ CRITICO: Secret debil
  // ❌ Expiracion muy larga (7 dias)
  // ❌ No incluye issuer, audience, etc.
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export { JWT_SECRET };
