# Reporte de Coverage - Testing Assignment

## Resumen Ejecutivo

### API Coverage (Backend)
| Metrica    | Cobertura | Threshold |
|------------|-----------|-----------|
| Statements | 64.52%    | 80%       |
| Branches   | 42.76%    | 80%       |
| Functions  | 55.07%    | 80%       |
| Lines      | 64.40%    | 80%       |

### UI Coverage (Frontend)
| Metrica    | Cobertura |
|------------|-----------|
| Statements | 45.99%    |
| Branches   | 34.30%    |
| Functions  | 46.03%    |
| Lines      | 45.64%    |

---

## Archivos con Coverage < 70%

### API (Backend)

| Archivo | Statements | Uncovered Lines |
|---------|------------|-----------------|
| `src/index.ts` | 0% | 1-6 |
| `src/components/AboutMe/index.ts` | 27.27% | 14-19, 31-36, 48-53, 65-70 |
| `src/components/AboutMe/service.ts` | 16.12% | 17-103 |
| `src/components/AboutMe/validation.ts` | 33.33% | 17-55 |
| `src/components/Auth/index.ts` | 32.14% | 22-32, 46-69, 83-91 |
| `src/components/Auth/service.ts` | 16% | 18-70 |
| `src/components/Auth/validation.ts` | 42.85% | 18-45 |
| `src/config/middleware/jwtAuth.ts` | 0% | 1-44 |
| `src/config/server/index.ts` | 0% | 1-16 |
| `src/config/server/serverHandlers.ts` | 0% | 1-39 |

### UI (Frontend)

| Archivo | Statements | Uncovered Lines |
|---------|------------|-----------------|
| `src/App.tsx` | 0% | 1-33 |
| `src/components/background/WaveLanding.tsx` | 0% | 1-19 |
| `src/components/cards/AboutMeCard.tsx` | 0% | 1-120 |
| `src/components/cards/AboutMeCardRow.tsx` | 0% | 1-82 |
| `src/components/routes/Admin.tsx` | 0% | 1-287 |
| `src/components/routes/Dashboard.tsx` | 0% | 1-160 |
| `src/components/routes/LandingPage.tsx` | 0% | 1-81 |
| `src/components/routes/Login.tsx` | 0% | 1-176 |
| `src/components/routes/PrivateRoute.tsx` | 0% | 1-15 |
| `src/mocks/handlers.ts` | 0% | 1-128 |
| `src/utils/mock-response.ts` | 0% | 4-51 |

---

## Lineas Sin Cobertura Identificadas

### Linea 1: `api/src/components/Projects/index.ts:51`
**Ubicacion:** Catch block en funcion `findOne`
**Descripcion:** Path de error cuando HttpError es lanzado
**Test necesario:** Test que genere un error no relacionado con validacion

### Linea 2: `ui/src/hooks/useFetchData.ts:28`
**Ubicacion:** Branch donde el error no es instanceof Error ni GenericError
**Descripcion:** Cuando el error capturado no es una instancia de Error o GenericError
**Test necesario:** Test que rechace con un valor que no sea Error

---

## Codigo Muerto (Dead Code) Identificado

### API
1. **`src/components/Projects/model.ts` - `IProjectsRequest` interface (lineas 8-11)**
   - Define `id` y `title` pero no se usa en ninguna parte del codigo
   - Recomendacion: Eliminar si no es necesario

2. **`src/components/Projects/model.ts` - `AuthToken` type (lineas 28-31)**
   - Definido en el modelo de Projects pero parece pertenecer a Auth
   - Recomendacion: Mover a Auth o eliminar si es duplicado

### UI
1. **`src/utils/mock-response.ts`**
   - Archivo completo sin uso (0% coverage)
   - MSW handlers en `src/mocks/handlers.ts` proveen la misma funcionalidad
   - Recomendacion: Verificar si es necesario o eliminar

2. **`src/mocks/server.ts` y `src/mocks/handlers.ts`**
   - 0% coverage indica que no se estan usando en tests
   - Recomendacion: Integrar en tests o eliminar

---

## Tests Implementados en Este Assignment

### Parte 2: ProjectContext Tests
- Archivo: `ui/src/context/__tests__/ProjectContext.test.tsx`
- Tests: 10 tests
- Coverage logrado: 100% statements, 71.42% functions

### Parte 3: useFetchData Tests
- Archivo: `ui/src/hooks/__tests__/useFetchData.test.tsx`
- Tests: 17 tests
- Coverage logrado: 100% statements, 80% branches

### Parte 4: ProjectsRouter Tests
- Archivo: `api/src/routes/tests/ProjectsRouter.test.ts`
- Tests: 10 tests
- Coverage de Projects component: 88.75% statements

---

## Tests E2E con Cypress (UI)

### Resumen General
| Suite | Tests | Descripcion |
|-------|-------|-------------|
| Login Page | 9 tests | Validacion de formulario, login exitoso/fallido, estados de loading |
| Dashboard Page | 12 tests | Carga de datos con fixtures, estados de loading, manejo de errores, navegacion |
| User Journey | 11 tests | Flujos completos E2E, tests responsive, navegacion con teclado, verificacion de requests |
| **Total** | **32 tests** | |

### Parte 5: Login Page Tests
- **Archivo:** `ui/cypress/e2e/auth/login.cy.ts`
- **Tests:** 9 tests
- **Cobertura funcional:**
  - Validacion de campos vacios (email, password, ambos)
  - Login exitoso con credenciales validas
  - Almacenamiento de token en localStorage
  - Login fallido con credenciales invalidas
  - Limpieza de errores al modificar campos
  - Estado de loading durante peticion
  - Navegacion desde header

### Parte 6: Dashboard Page Tests
- **Archivo:** `ui/cypress/e2e/dashboard/dashboard.cy.ts`
- **Tests:** 12 tests
- **Cobertura funcional:**
  - Carga de datos usando fixtures (aboutme.json, projects.json)
  - Visualizacion correcta de informacion de AboutMe y Projects
  - Estados de loading mientras cargan datos
  - Manejo de errores de API (500, errores parciales)
  - Navegacion entre paginas (Home, Admin, Dashboard)
  - Uso de comandos personalizados (visitWithMocks)

### Parte 7: User Journey Tests (Flujos E2E)
- **Archivo:** `ui/cypress/e2e/flows/user-journey.cy.ts`
- **Tests:** 11 tests
- **Cobertura funcional:**
  - Flujo completo Landing → Dashboard → Login → Admin
  - Verificacion de datos en cada paso del flujo
  - Autenticacion y acceso a rutas protegidas
  - **Bonus A - Tests Responsive:** Viewport mobile (iPhone X), tablet (iPad), desktop
  - **Bonus B - Navegacion con Teclado:** Tab entre campos, submit con Enter
  - **Bonus C - Verificacion de Request Body:** Credenciales en body, headers content-type

### Comandos Personalizados Implementados
- `cy.mockLoginApi(options)` - Mock de API de autenticacion
- `cy.mockDashboardApi(options)` - Mock de APIs de dashboard (aboutme, projects)
- `cy.visitWithMocks(url, options)` - Visitar pagina con mocks preconfigurados

### Fixtures Utilizados
- `aboutme.json` - Datos de prueba para AboutMe
- `projects.json` - Datos de prueba para Projects

---