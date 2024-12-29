const Joi = require('joi');

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    availableColors: Joi.array().items(Joi.string()),
    availableSizes: Joi.array().items(Joi.string()),
    availableQuantity: Joi.number(),
    discount: Joi.number(),
    price: Joi.number().required(),
    categoriesId: Joi.array().items(Joi.number()),
    productImages: Joi.array().items(
      Joi.object().keys({
        url: Joi.string().required(),
      })
    ),
  }).required(),
};

const getProducts = {
  query: Joi.object().keys({
    name: Joi.string(),
    availableColors: Joi.string(),
    availableSizes: Joi.string(),
    categoryId: Joi.number(),
  }),
};

const getProductById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};


const updateProductById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    availableColors: Joi.array().items(Joi.string()),
    availableSizes: Joi.array().items(Joi.string()),
    availableQuantity: Joi.number(),
    price: Joi.number(),
    discount: Joi.number(),
  }),
};

const deleteProductById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  createProduct,
  getProductById,
  updateProductById,
  deleteProductById,
  getProducts,
};
