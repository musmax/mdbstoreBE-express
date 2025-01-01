const Joi = require('joi');

const createOrder = {
    body: Joi.object().keys({
      paymentMethod: Joi.string().valid('paystack', 'flutterwave', 'wallet', 'monify').required(),
      deliveryAddress: Joi.string().required(),
      paymentObjects: Joi.array()
        .items(
          Joi.object().keys({
            productId: Joi.number().required(),
            quantity: Joi.number().required(),
          })
        )
        .min(1)
        .required(),
    }),
  };
  

const getOrders = {
  query: Joi.object().keys({
    transactionId: Joi.number(),
    deliveryAddress: Joi.string(),
    isDelivered: Joi.boolean(),
  }),
};

const getTransactions = {
  query: Joi.object().keys({
    orderId: Joi.number(),
    status: Joi.string(),
    reference: Joi.string(),
    paymentMethod: Joi.string().valid('paystack', 'flutterwave', 'monify', 'wallet'),
    alertType: Joi.string().valid('credit', 'debit', 'reverse', 'overdraft'),
  }),
};

const verifyTransaction = {
  query: Joi.object().keys({
    reference: Joi.string().required(),
  }),
};

const getOrderById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const getTransactionById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const updateOrderTracker = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    deliveryNote: Joi.string(),
    isDelivered: Joi.string(),
  }),
};



module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  verifyTransaction,
  getTransactionById,
  updateOrderTracker,
  getTransactions
};
