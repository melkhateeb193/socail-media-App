export const validation = (schema) => {
  return async (req, res, next) => {
    const resultObj = { ...req.body, ...req.query, ...req.param };
    const validationError = schema.validate(resultObj, {
      abortEarly: false,
    });

    if (validationError?.error) {
      return res
        .status(400)
        .json({
          msg: " validation error ",
          error: validationError?.error.details,
        });
    }

    next();
  };
};
