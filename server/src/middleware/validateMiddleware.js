import Joi from "joi";

export const validateMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    req.validatedData = value;
    next();
  };
};

export const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),
    restaurantName: Joi.string().optional(),
  }),
  createMenuItem: Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    category: Joi.string().required(),
    description: Joi.string().optional(),
    available: Joi.boolean().default(true),
  }),
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        specialInstructions: Joi.string().optional(),
      })
    ).required(),
    tableNumber: Joi.number().required(),
  }),
};
