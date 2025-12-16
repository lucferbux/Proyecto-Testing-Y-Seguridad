import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import routes from './routes';

// ❌ VULNERABLE - NO USAR EN PRODUCCION
// Este archivo contiene multiples vulnerabilidades de seguridad intencionales
// para propositos educativos de auditoria de seguridad.

const app = express();

// ========================================
// CONFIGURACION INSEGURA
// ========================================

// ❌ Sin Helmet - No hay headers de seguridad HTTP
// ❌ Sin rate limiting - Vulnerable a brute force
// ❌ Sin CORS restrictivo - Permite requests de cualquier origen
// ❌ Sin sanitizacion de entrada

// Parseo de JSON sin limite de tamano
app.use(express.json()); // ❌ Sin limite - vulnerable a DoS por payload grande

// ❌ X-Powered-By header expuesto (revela que usa Express)
// No se deshabilita con app.disable('x-powered-by')

// ========================================
// RUTAS
// ========================================
app.use('/api', routes);

// ========================================
// ERROR HANDLER VULNERABLE
// ========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // ❌ CRITICO: Log completo en consola (puede incluir datos sensibles)
  console.log('Error:', err);
  console.log('Request body:', req.body); // ❌ Loguea passwords y datos sensibles

  // ❌ CRITICO: Expone informacion sensible en respuesta
  res.status(500).json({
    error: err.message,
    stack: err.stack, // ❌ Stack trace completo expuesto
    path: req.path,
    method: req.method,
    body: req.body, // ❌ Puede exponer credentials en error response
  });
});

// ========================================
// CONEXION A BASE DE DATOS
// ========================================
export async function connectDatabase(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/vulnerable-app';

  // ❌ Sin autenticacion de MongoDB
  // ❌ Sin SSL/TLS
  await mongoose.connect(mongoUri);
}

// ========================================
// INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

export function startServer(): void {
  app.listen(PORT, () => {
    // ❌ Sin HTTPS - trafico en texto plano
    console.log(`Vulnerable API running on http://localhost:${PORT}`);
  });
}

export default app;
