import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction } from 'express';

// ✅ SEGURO - Sanitizacion de entrada para prevenir inyecciones

// ✅ Middleware de sanitizacion MongoDB
// Remueve caracteres $ y . de req.body, req.query, req.params
export const sanitizeMongoQuery = mongoSanitize({
  replaceWith: '_', // Reemplazar caracteres prohibidos con _
  allowDots: false, // No permitir puntos (previene path traversal en queries)
  onSanitize: ({ req, key }) => {
    // Log intentos de inyeccion (sin datos sensibles)
    console.warn(`[Security] Sanitized key "${key}" in request from ${req.ip}`);
  },
});

// ✅ Middleware para validar tipos de datos en login
export function validateLoginInput(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  // Verificar que sean strings (no objetos para NoSQL injection)
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Datos invalidos' });
    return;
  }

  // Verificar longitud maxima
  if (email.length > 255 || password.length > 128) {
    res.status(400).json({ error: 'Datos invalidos' });
    return;
  }

  next();
}

// ✅ Middleware para sanitizar strings (prevenir XSS basico)
export function sanitizeStrings(req: Request, res: Response, next: NextFunction): void {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remover tags HTML basicos
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

// ✅ Middleware para validar Content-Type
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  // Solo para metodos que tienen body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({ error: 'Content-Type debe ser application/json' });
      return;
    }
  }

  next();
}
