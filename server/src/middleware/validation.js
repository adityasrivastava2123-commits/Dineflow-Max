import Joi from "joi";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().required().min(6).max(30),
  role: Joi.string().valid("customer", "admin", "manager", "staff", "kitchen"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createMenuItemSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().max(500),
  price: Joi.number().required().min(0),
  category: Joi.string().required(),
  vegetarian: Joi.boolean(),
  spicyLevel: Joi.number().min(0).max(5),
  preparationTime: Joi.number().min(1),
  addons: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      price: Joi.number(),
    })
  ),
});

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        menuItemId: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        specialInstructions: Joi.string(),
        addons: Joi.array(),
      })
    )
    .required(),
  tableNumber: Joi.number().min(1),
  notes: Joi.string().max(500),
  specialInstructions: Joi.string().max(500),
});

export const createOfferSchema = Joi.object({
  code: Joi.string().required().max(20).uppercase(),
  description: Joi.string().max(500),
  discount: Joi.number().required().min(0),
  type: Joi.string().valid("percentage", "fixed").required(),
  validFrom: Joi.date().required(),
  validUpto: Joi.date().required(),
  minimumOrderValue: Joi.number().min(0),
  maximumDiscount: Joi.number().min(0),
  usageLimit: Joi.number().min(1),
  isActive: Joi.boolean(),
});
