import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import routes from './routes';
import { sanitizeMongoQuery, validateContentType } from './middleware/sanitizer';
import { generalLimiter } from './middleware/rate-limiter';

// ✅ SEGURO - Configuracion de Express con mejores practicas

const app = express();

// ========================================
// HEADERS DE SEGURIDAD
// ========================================

// ✅ Helmet - Configura headers de seguridad HTTP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true, // ✅ Oculta X-Powered-By
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true, // ✅ X-Content-Type-Options: nosniff
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true, // ✅ X-XSS-Protection
  })
);

// ✅ Deshabilitar X-Powered-By explicitamente
app.disable('x-powered-by');

// ========================================
// CORS RESTRICTIVO
// ========================================

// ✅ CORS con origenes permitidos
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 600, // Cache preflight por 10 minutos
  })
);

// ========================================
// PARSEO Y SANITIZACION
// ========================================

// ✅ Limite de tamano del body (previene DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ✅ Compresion
app.use(compression());

// ✅ Sanitizacion de queries MongoDB
app.use(sanitizeMongoQuery);

// ✅ Validar Content-Type
app.use(validateContentType);

// ========================================
// RATE LIMITING GENERAL
// ========================================

// ✅ Rate limiting global (100 req/min)
app.use(generalLimiter);

// ========================================
// RUTAS
// ========================================
app.use('/api', routes);

// ========================================
// ERROR HANDLER SEGURO
// ========================================
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // ✅ Log interno completo (sin datos sensibles en produccion)
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';

  console.error('Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    // Solo incluir body sanitizado en desarrollo
    ...(process.env.NODE_ENV !== 'production' && { body: sanitizedBody }),
  });

  // ✅ Respuesta sin informacion sensible
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: isProduction ? 'Error interno del servidor' : err.message,
    // ✅ NO exponer stack trace
  });
});

// ========================================
// 404 HANDLER
// ========================================
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// ========================================
// CONEXION A BASE DE DATOS
// ========================================
export async function connectDatabase(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/secure-app';

  await mongoose.connect(mongoUri, {
    // ✅ Opciones de seguridad para MongoDB
    // authSource: 'admin', // Descomentar si MongoDB tiene autenticacion
    // ssl: true, // Descomentar para conexiones SSL
  });
}

// ========================================
// INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 3001;

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`Secure API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
