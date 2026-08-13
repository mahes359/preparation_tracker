// src/middleware/validate.js
// Zod schema validation middleware factory.
// Usage: router.post('/', validate(myZodSchema), controller)

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const err = new Error('Validation failed');
    err.name = 'ZodError';
    err.errors = result.error.errors;
    return next(err);
  }
  req.body = result.data; // use parsed/coerced data
  next();
};

module.exports = validate;
