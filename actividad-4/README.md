# Actividad 4: Auditoria de Seguridad

## Descripcion

Este ejercicio practico consiste en auditar una API Express vulnerable, identificar las vulnerabilidades, implementar las correcciones y escribir tests que verifiquen las protecciones.

## Objetivos de Aprendizaje

- Identificar vulnerabilidades comunes en aplicaciones web (OWASP Top 10)
- Implementar medidas de seguridad en APIs Express
- Escribir tests de seguridad automatizados
- Aplicar mejores practicas de desarrollo seguro

## Estructura del Proyecto

```
actividad-4/
├── src/
│   ├── vulnerable-api/     # API con vulnerabilidades intencionales
│   │   ├── app.ts
│   │   ├── routes/
│   │   ├── models/
│   │   └── middleware/
│   │
│   ├── secure-api/         # API con correcciones implementadas
│   │   ├── app.ts
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── validators/
│   │
│   └── tests/
│       ├── security/       # Tests de seguridad
│       │   ├── headers.test.ts
│       │   ├── rate-limiting.test.ts
│       │   ├── injection.test.ts
│       │   ├── xss.test.ts
│       │   ├── authorization.test.ts
│       │   └── password.test.ts
│       └── ...
│
└── docs/
    └── VULNERABILITIES.md  # Documentacion de 17 vulnerabilidades
```

## Instalacion

```bash
cd actividad-4
npm install
```

## Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar solo tests de seguridad
npm run test:security

# Ejecutar tests en modo watch
npm run test:watch

# Iniciar API vulnerable (solo para demostracion)
npm run dev:vulnerable

# Iniciar API segura
npm run dev:secure
```

## Tarea 1: Identificar Vulnerabilidades

Analiza el codigo en `src/vulnerable-api/` y enumera todas las vulnerabilidades que encuentres. Clasificalas por severidad (Critical, High, Medium, Low).

**Pista:** Busca al menos 15 vulnerabilidades diferentes.

Consulta `docs/VULNERABILITIES.md` para ver la solucion completa.

### Resumen de Vulnerabilidades

| Severidad | Cantidad |
|-----------|----------|
| Critical  | 5        |
| High      | 7        |
| Medium    | 4        |
| Low       | 1        |
| **Total** | **17**   |

## Tarea 2: Implementar Correcciones

Las correcciones estan implementadas en `src/secure-api/`. Estudia las diferencias entre ambas APIs:

### Principales Correcciones

1. **Headers de Seguridad** - Helmet configurado con CSP, HSTS, etc.
2. **Rate Limiting** - 5 intentos de login por 15 minutos
3. **Sanitizacion** - express-mongo-sanitize para prevenir NoSQL injection
4. **Validacion** - Joi schemas para todos los inputs
5. **Hashing de Passwords** - bcrypt con 12 salt rounds
6. **JWT Seguro** - Secret en env, algoritmo explicito, expiracion 1h
7. **Control de Acceso** - Verificacion de ownership y roles
8. **Respuestas JSON** - No HTML para prevenir XSS

## Tarea 3: Tests de Seguridad

Los tests estan en `src/tests/security/`. Cada archivo prueba una categoria de vulnerabilidad:

| Test | Descripcion |
|------|-------------|
| `headers.test.ts` | Verifica headers de seguridad HTTP |
| `rate-limiting.test.ts` | Prueba proteccion contra fuerza bruta |
| `injection.test.ts` | Prueba NoSQL injection |
| `xss.test.ts` | Prueba XSS reflejado |
| `authorization.test.ts` | Prueba IDOR, mass assignment, roles |
| `password.test.ts` | Prueba almacenamiento y validacion de passwords |

### Ejecutar Tests

```bash
# Ver resultados detallados
npm run test:security -- --verbose

# Con coverage
npm run test:coverage
```

## Rubrica de Evaluacion

| Criterio | Puntos | Descripcion |
|----------|--------|-------------|
| Identificacion | 20 | 15+ vulnerabilidades con severidad correcta |
| Implementacion | 40 | Codigo seguro con todas las protecciones |
| Tests | 30 | Suite completa cubriendo todas las protecciones |
| Documentacion | 10 | Codigo comentado con README |

## Enfoque Incremental

Trabaja por capas:

1. **Headers (Helmet)** - Configurar headers de seguridad
2. **Autenticacion (bcrypt, JWT)** - Hashing y tokens seguros
3. **Validacion (Joi)** - Validar todos los inputs
4. **Rate limiting** - Prevenir fuerza bruta
5. **Sanitizacion** - Prevenir inyecciones
6. **Autorizacion** - Verificar ownership y roles
7. **Tests** - Verificar cada proteccion

## Variables de Entorno

Crear archivo `.env`:

```env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/security-audit
JWT_SECRET=your-super-secret-key-at-least-32-characters-long!
ALLOWED_ORIGINS=http://localhost:3000
```

## Dependencias de Seguridad

```json
{
  "helmet": "^7.0.0",
  "express-rate-limit": "^7.0.0",
  "express-mongo-sanitize": "^2.2.0",
  "bcrypt": "^5.1.0",
  "joi": "^17.8.3"
}
```

## Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js](https://helmetjs.github.io/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Joi Validation](https://joi.dev/)

## Checklist de Verificacion

- [ ] NoSQL Injection prevenido
- [ ] Passwords hasheados con bcrypt (12+ rounds)
- [ ] JWT secret en variable de entorno (32+ chars)
- [ ] Verificacion de ownership en CRUD
- [ ] Verificacion de rol en endpoints admin
- [ ] Rate limiting en login (5 intentos/15min)
- [ ] Respuestas JSON (no HTML)
- [ ] Validacion con Joi
- [ ] Sin mass assignment
- [ ] Password excluido de respuestas
- [ ] Error handler sin stack trace
- [ ] JWT con algoritmo explicito
- [ ] Helmet configurado
- [ ] Mensajes de error genericos
- [ ] CORS restrictivo
- [ ] Limite de body (10kb)
