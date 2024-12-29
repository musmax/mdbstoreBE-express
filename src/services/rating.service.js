const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Rating } = require('../models/rating.model');
const { buildWhereCondition } = require('../utils/FilterSort');

/**
 * @typedef {Object} RatingObject
 * @property {string} review
 * @property {number} star
 * @property {number} productId
 */

/**
 * Fetch all City
 * @param {Object} filter
 * @param {string} filter.productId
 * @returns {Promise<*>}
 */
const fetchAllratings = async (filter, options) => {
  const { docs, pages, total } = await Rating.paginate({
    where: buildWhereCondition({ ...filter }),
    ...options,
  });
  return {
    docs,
    pagination: {
      limit: options.paginate,
      page: options.page,
      totalResults: total,
      totalPages: pages,
    },
  };
};

/**
 * Fetch a Rating by id
 * @param {number} id
 * @returns {Promise<RatingObject>}
 */
const fetchRateyId = async (id) => {
  const rating = await Rating.findByPk(id);
  if (!rating) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Rating not found');
  }
  return rating;
};


/**
 * Create a new rating
 * @param {Object} Rateody
 * @param {string} Rateody.review
 * @param {number} Rateody.rating
 * @param {number} Rateody.productId
 * @returns {Promise<RatingObject>}
 */
const createRating = async (Rateody, userId) => {
  const {productId} = Rateody;
  await fetchProductById(productId);
  return Rating.create({...Rateody, productId, userId});
};


module.exports = {
  fetchAllratings,
  fetchRateyId,
  createRating,
};
