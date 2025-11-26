import { IUserModel } from '@/components/User/model';

// ==================== DATOS BÁSICOS ====================

// Usuario válido estándar - el caso más común
export const validUser: Partial<IUserModel> = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
};

// Casos de usuarios inválidos - para testear validaciones
export const invalidUsers = {
  noEmail: { 
    password: 'SecurePassword123!',
  } as Partial<IUserModel>,
  
  noPassword: { 
    email: 'no-password@example.com',
  } as Partial<IUserModel>,
  
  invalidEmail: { 
    email: 'not-an-email', // Sin @ ni dominio
    password: 'SecurePassword123!',
  } as Partial<IUserModel>,
  
  weakPassword: {
    email: 'weak@example.com',
    password: '123', // Demasiado corta
  } as Partial<IUserModel>,
};

// ==================== COLECCIONES ====================

// Conjunto de usuarios de muestra para tests que necesitan múltiples usuarios
export const sampleUsers: Partial<IUserModel>[] = [
  { email: 'alice@example.com', password: 'AlicePass123!' },
  { email: 'bob@example.com', password: 'BobSecure456!' },
  { email: 'charlie@example.com', password: 'Charlie789!' },
];

// Usuario con token de reset
export const userWithResetToken: Partial<IUserModel> = {
  email: 'reset@example.com',
  password: 'OldPassword123!',
  passwordResetToken: 'reset-token-abc123',
  passwordResetExpires: new Date(Date.now() + 3600000), // 1 hora desde ahora
};