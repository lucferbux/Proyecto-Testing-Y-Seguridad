# Copilot Instructions - Personal Portfolio (Testing & Security Workshop)

## Project Architecture

This is a full-stack TypeScript portfolio application with a **Node.js/Express REST API** (`api/`) and a **React/Vite frontend** (`ui/`). The backend uses **MongoDB with Mongoose** for data persistence.

### Backend Structure (`api/`)
- **Component-based architecture**: Each feature is a self-contained component in `src/components/` with:
  - `model.ts` - Mongoose schema definition
  - `service.ts` - Business logic layer
  - `validation.ts` - Joi schema validation (extends custom `@/components/validation`)
  - `interface.ts` - TypeScript interfaces
  - `index.ts` - Express route handlers
- **Path aliases**: Use `@/` for absolute imports (configured via `module-alias` in `src/index.ts`)
  - `@/components` → component modules
  - `@/config` → configuration (middleware, DB connection, errors)
- **Main components**: `Auth`, `User`, `AboutMe`, `Projects`
- **Authentication**: JWT-based using `@/config/middleware/jwtAuth.isAuthenticated` middleware
  - Protected routes require `Bearer <token>` in Authorization header
  - Secret configured in `.env` file (default: `e89f987sdfs9d879f8798dsf78978`)

### Frontend Structure (`ui/`)
- **React 18** with **React Router v6** for navigation
- **Styled Components** for CSS-in-JS styling
- **i18next** for internationalization (supports `es-ES`, `en-US`)
- **Context API** for state management:
  - `AuthContext` - User authentication state and JWT token management
  - `ProjectContext` - Project data state
- **API Client**: Factory pattern in `src/api/` with custom error types (`BadRequest`, `Unauthorized`, etc.)

## Development Workflow

### Setup & Environment Variables
1. **Backend** (`api/.env`):
   - `NODE_ENV` - `development` or `production`
   - `PORT` - API server port (default: `4000`)
   - `SECRET` - JWT secret for token signing/verification

2. **Frontend** (`ui/.env`):
   - `VITE_LOCALE` - Default language (`es-ES` or `en-US`)
   - `VITE_API_URI` - Backend API URL (default: `http://localhost:4000`)
   - `VITE_BASE_URI` - Optional base path for API routes

### Common Commands (via Makefile)
- `make install-dependencies` - Install deps for both api/ and ui/
- `make dev-start` - Start MongoDB + API + UI concurrently (Linux/macOS only)
- `make dev-api` - Run backend dev server (nodemon)
- `make dev-ui` - Run frontend dev server (Vite)
- `make dev-bbdd-start-populate` - Start MongoDB and import seed data
- `make dev-populate-data` - Import seed data only (MongoDB must be running)
- `make generate-password -e USER=email@test.com -e PASS=newpass` - Generate bcrypt hash for new credentials

**Windows users**: Start MongoDB manually, then run `make dev-api` and `make dev-ui` in separate terminals.

### Database Seeding
Seed data in `scripts/` uses `mongoimport --jsonArray`:
- `mockUsername.json` → `users` collection
- `mockProfile.json` → `profile` collection (AboutMe data)
- `mockProjects.json` → `projects` collection
- **Default credentials**: `patata` (hash: `$2b$10$YZ1W1tjiKP3g4j8mGzJAhelx0nlQ4otJIefWXGco8.bk6SOxaunhy`)

## Key Patterns & Conventions

### Backend Validation Pattern
All components use **Joi** for request validation in service layer:
```typescript
const validate = ValidationClass.methodName(data);
if (validate.error) {
  throw new Error(validate.error.message);
}
```
Custom `objectId` validator extends Joi for MongoDB ObjectId validation.

### Error Handling
- Backend: `@/config/error/HttpError` for HTTP status errors
- Frontend: Custom error classes in `src/api/api-client.ts` (`Unauthorized`, `NotFound`, etc.)

### Component Structure (Frontend)
Components organized in `src/components/`:
- `layout/` - Page layouts and structure
- `cards/` - Reusable card components
- `elements/` - Atomic UI elements
- `routes/` - Route-level components

### Authentication Flow
1. Frontend sends login request to `/v1/auth` (no JWT required)
2. Backend returns JWT token
3. Frontend stores token and includes in subsequent requests via `Authorization: Bearer <token>`
4. Protected routes check token with `jwtAuth.isAuthenticated` middleware
5. Token auto-renewal handled in `AuthContext` via `setLogoutIfExpiredHandler`

## Testing & Build
- **Backend**: No test framework currently configured (linting via ESLint/TSLint)
- **Frontend**: Test infrastructure present (coverage/ directory exists) but no test scripts in package.json
- **Build commands**:
  - API: `npm run build` (TypeScript compilation to `build/`)
  - UI: `npm run build` (Vite production build)

## Important Notes
- **Swagger docs**: API documentation at `/docs` endpoint (requires `swagger.json` generated from `swaggerDef.js`)
- **Database name**: `portfolio_db` (configurable in backend connection)
- **Module resolution**: Backend uses CommonJS with `ts-node`, not ES modules
- **Linting**: Both projects use ESLint with Airbnb style guide + TypeScript extensions
