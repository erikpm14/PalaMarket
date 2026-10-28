import { AppError } from '../utils/AppError.js';

/** Valida body o params con un esquema de zod y deja el resultado ya normalizado en req.valid. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message || 'Valor no válido.',
    }));
    return next(new AppError(400, 'VALIDATION_ERROR', 'Hay datos que no son válidos.', details));
  }
  req.valid = { ...req.valid, [source]: result.data };
  return next();
};
