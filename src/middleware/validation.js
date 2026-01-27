const Joi = require("joi");
const { ValidationError } = require("./errorHandler");

/**
 * Request validation middleware factory
 */
const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    const data =
      source === "body"
        ? req.body
        : source === "query"
          ? req.query
          : source === "params"
            ? req.params
            : req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      throw new ValidationError("Request validation failed", details);
    }

    // Replace the source data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Product ID parameter validation
  productId: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  // Pagination validation
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
  }),

  // Search query validation
  searchQuery: Joi.object({
    query: Joi.string().max(200).allow("").trim(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string()
      .valid(
        "relevance",
        "price_low",
        "price_high",
        "rating",
        "popularity",
        "newest",
      )
      .default("relevance"),
    category: Joi.string().max(100).trim(),
    brand: Joi.string().max(100).trim(),
    minPrice: Joi.number().positive(),
    maxPrice: Joi.number()
      .positive()
      .when("minPrice", {
        is: Joi.exist(),
        then: Joi.number().greater(Joi.ref("minPrice")),
        otherwise: Joi.number().positive(),
      }),
    minRating: Joi.number().min(0).max(5),
    inStock: Joi.boolean(),
    priceRange: Joi.string().pattern(/^\d+-\d+$|^\d+\+$/),
    ratingRange: Joi.string().pattern(/^\d+(\.\d+)?\+$/),
  }),
};

module.exports = {
  validateRequest,
  schemas,
};
