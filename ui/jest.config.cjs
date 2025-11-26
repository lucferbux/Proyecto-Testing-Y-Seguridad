module.exports = {
  // Entorno de ejecución
  testEnvironment: 'jsdom',
  
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Configuración de ts-jest (nueva sintaxis)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        useESM: false,
      },
    ],
  },
  
  // Transformar módulos ESM de node_modules que MSW necesita
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs|until-async|@bundled-es-modules|outvariant|strict-event-emitter|cookie|@open-draft)/)',
  ],
  
  // Paths de módulos - Mapear imports de Vite
  moduleNameMapper: {
    // CSS Modules y estilos
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Assets (imágenes, SVGs, etc.)
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.cjs',
    
    // Alias de Vite (si los usas en vite.config.ts)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Archivos de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // Extensiones de archivos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Patrones de tests
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',           // Entry point
    '!src/App.tsx',            // App root (muy acoplado a React)
    '!src/vite-env.d.ts',      // Vite types
    '!src/**/*.stories.tsx',   // Storybook (si lo tienes)
    '!src/styles/**',          // Styled Components
    '!src/utils/__mocks__/**', // Mocks manuales
    '!src/locales/**',         // Traducciones i18n
    '!src/constants/**',       // Solo constantes
  ],
  
  // Ignorar archivos del coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '\\.config\\.(js|ts)$',
    '/__mocks__/',
    '/src/types/',
    '/src/vite-env.d.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Código crítico de autenticación necesita mayor coverage
    './src/utils/auth.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // API client es crítico para funcionamiento
    './src/api/http-api-client.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  
  // Transformaciones
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};