import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// ✅ SEGURO - Implementacion con mejores practicas de seguridad

export interface ISecureUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const SecureUserSchema = new Schema<ISecureUser>({
  username: {
    type: String,
    required: [true, 'Username es requerido'],
    minlength: [3, 'Username debe tener al menos 3 caracteres'],
    maxlength: [30, 'Username no puede exceder 30 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username solo puede contener letras, numeros y guion bajo'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email debe ser valido'],
  },
  password: {
    type: String,
    required: [true, 'Password es requerido'],
    minlength: [12, 'Password debe tener al menos 12 caracteres'],
    select: false, // ✅ No se incluye en queries por defecto
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // ✅ Solo valores permitidos
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Pre-save hook para hashear password
SecureUserSchema.pre('save', async function (next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // ✅ bcrypt con 12 rounds (recomendado)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// ✅ Metodo para comparar passwords de forma segura
SecureUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // bcrypt.compare es seguro contra timing attacks
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// ✅ Transformar output para no exponer datos sensibles
SecureUserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

SecureUserSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const SecureUser = mongoose.model<ISecureUser>('SecureUser', SecureUserSchema);
