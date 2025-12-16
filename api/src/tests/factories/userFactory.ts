import { IUserModel } from '@/components/User/model';

let userId = 1;

export function resetUserFactory() {
  userId = 1;
}

/**
 * Construye un usuario con valores por defecto.
 */
export function buildUser(attrs: Partial<IUserModel> = {}): Partial<IUserModel> {
  const id = `user-${userId++}`;
  const email = attrs.email || `user${userId}@example.com`;
  
  return {
    _id: id,
    email,
    password: attrs.password || 'SecurePassword123!',
    ...attrs,
  };
}

/**
 * Crea N usuarios.
 */
export function buildUsers(count: number, attrs: Partial<IUserModel> = {}): Partial<IUserModel>[] {
  return Array.from({ length: count }, () => buildUser(attrs));
}

/**
 * Usuario con token de reset activo.
 */
export function buildUserWithResetToken(): Partial<IUserModel> {
  return buildUser({
    passwordResetToken: `reset-${Date.now()}`,
    passwordResetExpires: new Date(Date.now() + 3600000), // 1 hora
  });
}