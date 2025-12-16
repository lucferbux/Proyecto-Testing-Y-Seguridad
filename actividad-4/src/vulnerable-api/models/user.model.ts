import mongoose, { Document, Schema } from 'mongoose';

// ❌ VULNERABLE - NO USAR EN PRODUCCION
// Vulnerabilidades:
// 1. Password en texto plano (sin hash)
// 2. No hay validacion de campos
// 3. Campo role puede ser manipulado (mass assignment)
// 4. Password no excluido de queries

export interface IUser extends Document {
  username: string;
  email: string;
  password: string; // ❌ Texto plano
  role: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    // ❌ Sin validacion de longitud minima
    // ❌ Sin sanitizacion
  },
  email: {
    type: String,
    // ❌ Sin validacion de formato email
    // ❌ Sin unique constraint
  },
  password: {
    type: String,
    // ❌ CRITICO: Password almacenado en texto plano
    // ❌ Sin select: false (se expone en queries)
  },
  role: {
    type: String,
    default: 'user',
    // ❌ Sin enum validation - puede ser cualquier valor
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ❌ NO HAY pre-save hook para hashear password
// ❌ NO HAY metodo para comparar passwords de forma segura

export const VulnerableUser = mongoose.model<IUser>('VulnerableUser', UserSchema);
