import Joi from 'joi';

// ✅ SEGURO - Validacion robusta con Joi

// Patron para password seguro:
// - Minimo 12 caracteres
// - Al menos una mayuscula
// - Al menos una minuscula
// - Al menos un numero
// - Al menos un caracter especial
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Username es requerido',
      'string.min': 'Username debe tener al menos 3 caracteres',
      'string.max': 'Username no puede exceder 30 caracteres',
      'string.alphanum': 'Username solo puede contener letras y numeros',
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .max(255)
    .required()
    .messages({
      'string.empty': 'Email es requerido',
      'string.email': 'Email debe ser valido',
    }),

  password: Joi.string()
    .min(12)
    .max(128)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.empty': 'Password es requerido',
      'string.min': 'Password debe tener al menos 12 caracteres',
      'string.max': 'Password no puede exceder 128 caracteres',
      'string.pattern.base':
        'Password debe contener mayusculas, minusculas, numeros y caracteres especiales (@$!%*?&)',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Email es requerido',
      'string.email': 'Email debe ser valido',
    }),

  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Password es requerido',
    }),
});

export const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .messages({
      'string.min': 'Username debe tener al menos 3 caracteres',
      'string.max': 'Username no puede exceder 30 caracteres',
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .max(255)
    .messages({
      'string.email': 'Email debe ser valido',
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

// ✅ Validar ObjectId de MongoDB
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'ID invalido',
  });

// ✅ Funcion helper para validar
export function validate<T>(schema: Joi.Schema, data: unknown): { error?: string; value?: T } {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true, // ✅ Elimina campos no definidos en el schema
  });

  if (error) {
    return {
      error: error.details.map((d) => d.message).join(', '),
    };
  }

  return { value: value as T };
}
