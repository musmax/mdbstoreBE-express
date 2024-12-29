const Joi = require('joi');

const createRating = {
  body: Joi.object().keys({
    review: Joi.string().required(),
    stars: Joi.number().required(),
    productId: Joi.number().required()
})};

const getRatings = {
  query: Joi.object().keys({
    productId: Joi.number(),
  }),
};

const getRatingById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};


const updateRatingById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    review: Joi.string(),
    stars: Joi.number(),
    productId: Joi.number()
  }),
};


module.exports = {
  createRating,
  getRatingById,
  updateRatingById,
  getRatings,
};
