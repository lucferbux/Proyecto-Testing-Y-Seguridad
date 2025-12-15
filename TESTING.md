# Guía de Pruebas - Proyecto Testing y Seguridad

Este documento detalla cómo configurar y ejecutar las pruebas automatizadas para el proyecto, enfocándose principalmente en el frontend (`ui`).

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- **Node.js** (v14 o superior)
- **npm** (generalmente incluido con Node.js)
- **MongoDB** (necesario si vas a ejecutar el backend localmente)

## ⚙️ Configuración del Entorno

Antes de ejecutar las pruebas, es necesario instalar las dependencias del proyecto.

1. **Frontend (`ui`):**
   ```bash
   cd ui
   npm install
   ```

2. **Backend (`api`):**
   ```bash
   cd api
   npm install
   ```

## 🚀 Ejecución de Pruebas (Frontend)

Las pruebas del frontend utilizan **Jest** y **React Testing Library**.

### 1. Ejecutar todos los tests
Para correr la suite completa de pruebas:
```bash
cd ui
npm test
```

### 2. Ejecutar tests en modo "watch"
Para desarrollar y ver los resultados en tiempo real mientras modificas el código:
```bash
cd ui
npm test -- --watch
```

### 3. Ejecutar un archivo de test específico
Si solo quieres probar un componente o módulo específico:
```bash
# Ejemplo: Tests de Autenticación
npm test src/utils/auth.test.ts

# Ejemplo: Tests del Cliente API
npm test src/api/http-api-client.test.ts
```

### 4. Generar reporte de cobertura (Coverage)
Para ver qué porcentaje del código está cubierto por las pruebas:
```bash
cd ui
npm test -- --coverage
```
Esto generará una carpeta `coverage` en `ui/`. Puedes abrir `ui/coverage/lcov-report/index.html` en tu navegador para ver un reporte interactivo.

## 🧪 Descripción de los Tests Implementados

Hemos implementado pruebas unitarias y de integración para componentes clave:

### 1. Utilidades de Autenticación (`src/utils/auth.test.ts`)
Verifica la lógica de manejo de tokens JWT.
- **Casos cubiertos:**
  - Guardado y recuperación de tokens en `localStorage`.
  - Verificación de expiración de tokens.
  - Decodificación de información del usuario.
  - Manejo de cierre de sesión automático.

### 2. Componente Loader (`src/components/elements/Loader.test.tsx`)
Verifica que el componente de carga se visualice correctamente.
- **Casos cubiertos:**
  - Renderizado del mensaje personalizado.
  - Presencia de la imagen con texto alternativo correcto.
  - Estructura del DOM.

### 3. Tarjeta de Proyecto (`src/components/cards/ProjectCard.test.tsx`)
Verifica la visualización e interacción de las tarjetas de proyectos.
- **Casos cubiertos:**
  - Renderizado de título, descripción y etiquetas.
  - **Lógica Condicional:** El menú de administración (Editar/Eliminar) solo aparece si el usuario está logueado.
  - Interacción con los botones de editar y eliminar.

### 4. Cliente HTTP (`src/api/http-api-client.test.ts`)
Verifica la comunicación con el backend simulando las peticiones (Mocking).
- **Casos cubiertos:**
  - **Login:** Envío de credenciales y manejo de respuesta exitosa.
  - **Manejo de Errores:** Conversión de códigos HTTP (400, 401, 403, 404, 500) a errores personalizados (`BadRequest`, `Unauthorized`, etc.).
  - **CRUD de Proyectos:** Tests para `postProject`, `updateProject`, `deleteProject` y la lógica de `createOrUpdateProject`.

## 🛠 Tecnologías Utilizadas

- **Jest:** Framework de pruebas (Runner, Assertions, Mocks).
- **React Testing Library:** Para renderizar componentes y simular interacciones de usuario de manera accesible.
- **ts-jest:** Para permitir que Jest entienda TypeScript.
- **jest-environment-jsdom:** Simula un entorno de navegador en la terminal.
