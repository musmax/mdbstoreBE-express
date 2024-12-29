const { Op, Sequelize } = require('sequelize');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { buildWhereCondition } = require('../utils/FilterSort');
const { Product } = require('../models/product.model');
const { fetchCategoryById } = require('./category.service');
const { ProductImages } = require('../models/productImage.model');
const { Category } = require('../models/category.model');
const { productCategory } = require('../models/productCategory.model');

/**
 * @typedef {Object} ProductObject
 * @property {string} name
 * @property {string} description
 * @property {number} discount
 * @property {number} availableQuantity
 * @property {array} availableSizes
 * @property {array} availableColors
 * @property {array} categoriesId
 * @property {array} availableColors
 * @property {array} productImages
 */

/**
 * Fetch all Products
 * @param {Object} filter
 * @param {string} filter.name
 * @param {string} filter.availableSizes
 * @param {string} filter.availableColors
 * @returns {Promise<*>}
 */
const fetchAllProducts = async (filter, options) => {
  const { categoryId } = filter;

  // Modify the filter for availableColors and availableSizes
  if (filter.availableColors) {
    filter.availableColors = Sequelize.literal(
      `JSON_CONTAINS(availableColors, '"${filter.availableColors}"')`
    );
  }
  if (filter.availableSizes) {
    filter.availableSizes = Sequelize.literal(
      `JSON_CONTAINS(availableSizes, '"${filter.availableSizes}"')`
    );
  }

  // Remove categoryId from the filter to avoid it being included in the whereCondition
  delete filter.categoryId;

  // Build the query condition
  const whereCondition = buildWhereCondition({ ...filter });

  if (categoryId) {
    console.log(categoryId);
    // Find all product records associated with the given category
    const productsMatchingTheCategory = await productCategory.findAll({
      where: { categoryId },
      attributes: ['productId'],
    });

    // Extract productIds from the results
    const productIds = productsMatchingTheCategory.map((record) => record.productId);

    // If no products match the category, return an empty response early
    if (productIds.length === 0) {
      return {
        products: [],
        pagination: {
          limit: options.paginate,
          page: options.page,
          totalResults: 0,
          totalPages: 0,
        },
      };
    }

    // Add productId condition to the main query
    whereCondition.id = { [Op.in]: productIds };
  }

  // Use pagination with the whereCondition
  const { docs, pages, total } = await Product.paginate({
    where: whereCondition,
    include: [],
    ...options,
  });

  // Return the paginated response
  return {
    products: docs,
    pagination: {
      limit: options.paginate,
      page: options.page,
      totalResults: total,
      totalPages: pages,
    },
  };
};



/**
 * Fetch a Product by id
 * @param {number} id
 * @returns {Promise<ProductObject>}
 */
const fetchProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [
      {
        association: 'product_creator',
        attributes: ['id', 'firstname', 'lastname', 'email']
      },
      {
        association: 'categories',
        through: { attributes: [] },
      },
      {
        association: 'product_ratings',
      }
    ]
  });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};


/**
 * Create a new Product
 * @param {Object} ProductBody
 * @returns {Promise<ProductObject>}
 */
const createProduct = async (productBody, currentUser) => {

  const { categoriesId, productImages } = productBody;

  // Validate category IDs
  await Promise.all(
    categoriesId.map(async (categoryId) => {
      await fetchCategoryById(categoryId);
    })
  );

  // Create the product
  const product = await Product.create({ ...productBody, userId: currentUser });

  // Associate the product with its categories
  await Promise.all(
    categoriesId.map(async (categoryId) => {
      await productCategory.create({productId:product.id, categoryId})
    })
  )

  // Create and associate product images
  const productImagesInstances = await Promise.all(
    productImages.map(async (image) => {
      return ProductImages.create({ ...image, productId: product.id });
    })
  );

  return { product, productImages: productImagesInstances };
};



/**
 * Update Product by id
 * @param {number} id
 * @param {ProductObject} updateBody
 * @returns {Promise<ProductObject>}
 */
const updateProductById = async (id, updateBody) => {
  const product = await fetchProductById(id);
  return Object.assign(product, updateBody).save();
};

module.exports = {
  fetchAllProducts,
  fetchProductById,
  createProduct,
  updateProductById,
};
