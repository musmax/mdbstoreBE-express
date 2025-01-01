const httpStatus = require('http-status');
const axios = require('axios');
const ApiError = require('../utils/ApiError');
const { secret } = require('../config/config').paystack;
const logger = require('../config/logger');

/**
 * Initialize paystack transaction
 *
 * @param {number} amount
 * @param {string} email
 * @return {Promise<object>}
 */
const initializePaystackTransaction = async (amount, email) => {
  try {
    const { data } = await axios({
      method: 'post',
      url: 'https://api.paystack.co/transaction/initialize',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      data: {
        amount,
        email,
      },
    });
    return data;
  } catch (error) {
    logger.info(error);
  }
};

/**
 * Verify payment
 *
 * @param {string} reference
 * @returns {Promise<Order>}
 */
const verifyPayment = async (reference) => {
  try {
    const { data } = await axios({
      method: 'get',
      url: `https://api.paystack.co/transaction/verify/${reference}`,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!data.status) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment failed');
    }
    return data;
  } catch (error) {
    logger.info(error);
  }
};

/**
 * Renew payment
 *
 * @property {string} renewObject
 * @returns {Promise<Order>}
 */
const renewTransactionPayment = async (renewObject) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.paystack.co/transaction/charge_authorization`,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      data: renewObject,
    });
    return response.data; // Return Paystack's response data
  } catch (error) {
    throw error; // Re-throw the error for proper handling
  }
};

module.exports = {
  initializePaystackTransaction,
  verifyPayment,
  renewTransactionPayment,
};
