import rateLimit from 'express-rate-limit';

// ✅ SEGURO - Rate limiting para prevenir ataques de fuerza bruta

// ✅ Rate limiter para endpoint de login
// 5 intentos fallidos en 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Maximo 5 intentos
  skipSuccessfulRequests: true, // No contar intentos exitosos
  standardHeaders: true, // Incluir headers RateLimit-*
  legacyHeaders: false, // Deshabilitar X-RateLimit-* headers
  message: {
    error: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.',
  },
  // ✅ Key generator basado en IP
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

// ✅ Rate limiter para endpoint de registro
// Mas permisivo: 10 registros por hora por IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Maximo 10 registros
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados registros desde esta IP. Intente nuevamente en 1 hora.',
  },
});

// ✅ Rate limiter general para API
// 100 requests por minuto
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Maximo 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Intente nuevamente en un momento.',
  },
});

// ✅ Rate limiter estricto para operaciones sensibles
// 3 intentos en 5 minutos
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // Maximo 3 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Operacion limitada. Intente nuevamente en 5 minutos.',
  },
});
