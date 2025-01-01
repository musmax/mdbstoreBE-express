const { Op, Sequelize } = require('sequelize');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { buildWhereCondition } = require('../utils/FilterSort');
const { Order } = require('../models/order.model');
const { OrderProducts } = require('../models/order_products.model');
const { Transaction } = require('../models/transaction.model');
const { initializePaystackTransaction, verifyPayment } = require('./paystack.service');
const { fetchProductById } = require('./product.service');
const { Wallet } = require('../models/wallet.model');

/**
 * @typedef {Object} PaymentObject
 * @property {string} paymentMethod - The payment method (e.g., 'paystack', 'flutterwave', 'wallet').
 * @property {Array.<{productId: number, quantity: number}>} paymentObjects - An array of objects, each containing a productId and quantity.
 */

/**
 * Helper function find wallet
 */
const findWallet = async (userId) => {
  const wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Wallet not found');
  }
  return wallet;
}

/**
 * Create a new transaction
 * @param {Object} transactionBody
 * @param {number} currentUser
 * @returns {Promise<PaymentObject>}
 */
const initializeTransaction = async (transactionBody, currentUser) => {
    const {paymentMethod, paymentObjects, deliveryAddress} = transactionBody;

    // lets get the product total amount
    const productTotalAmount = await Promise.all(
    paymentObjects.map(async (productObject) => {
    const product = await fetchProductById(productObject.productId);
    return product.price * productObject.quantity;
        })
      ).then((amounts) => amounts.reduce((total, amount) => total + amount, 0));
    if (paymentMethod === 'paystack') {
        // lets initiate the order
        const order = await Order.create({
            userId: currentUser,
            amount: productTotalAmount,
            deliveryAddress
        });
        // lets associate the products to the order
        await Promise.all(
            paymentObjects.map(async (productObject) => {
                await OrderProducts.create({
                    orderId: order.id,
                    productId: productObject.productId,
                    quantity: productObject.quantity
                })
            })
        )
        // lets talk to the gateway
        const amountInKobo = productTotalAmount * 100;
        const payment = await initializePaystackTransaction(amountInKobo, currentUser.email);
        if (!payment.status) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to initialise the payment');
        }
        // lets initiate the transaction
        const transaction = await Transaction.create({
            orderId: order.id,
            paymentMethod: paymentMethod,
            amount: productTotalAmount,
            status: 'pending',
            reference:payment.data.reference,
            userId: currentUser.id,
        })
        await order.update({transactionId: transaction.id});
        return {
          url: payment.data.authorization_url,
          reference: payment.data.reference
        };
    }
    else if (paymentMethod === 'wallet') {
      // lets get the user wallet detail
      const userWallet = await findWallet(currentUser.id);
      if (userWallet.balance === 0 || userWallet.balance < productTotalAmount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
      }
      // lets deduct the amount from the user wallet
      await userWallet.update({balance: userWallet.balance - productTotalAmount});
              // lets initiate the order
              const order = await Order.create({
                userId: currentUser,
                amount: productTotalAmount,
                deliveryAddress
            });
              // lets initiate the transaction
              const transaction = await Transaction.create({
                orderId: order.id,
                paymentMethod: paymentMethod,
                amount: productTotalAmount,
                status: 'success',
                reference:'wallet',
                alertType: 'debit',
                userId: currentUser.id,
            })
            await order.update({transactionId: transaction.id});
        // lets associate the products to the order
        await Promise.all(
          paymentObjects.map(async (productObject) => {
              await OrderProducts.create({
                  orderId: order.id,
                  productId: productObject.productId,
                  quantity: productObject.quantity
              })
          })
      )
      return {
        message: 'wallet payment successful'
      }
    }
}
/**
 * Create a new transaction
 * @param {Object} transactionBody
 * @param {number} currentUser
 * @returns {Promise<PaymentObject>}
 */
const initializeWalletTransaction = async (transactionBody, currentUser) => {
    const {amount} = transactionBody;
    const amountInKobo = amount * 100;
    const payment = await initializePaystackTransaction(amountInKobo, currentUser.email);
    if (!payment.status) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to initialise the payment');
    }
        // lets initiate the transaction
        await Transaction.create({
            paymentMethod: 'wallet',
            amount: productTotalAmount,
            status: 'success',
            reference:payment.data.reference,
            userId: currentUser.id,
            alertType: 'credit'
        })
        return {
          url: payment.data.authorization_url,
          reference: payment.data.reference
        };
    
}

/**
 * Transfer from wallet
 */
const transferFromWallet = async (transferBody, currentUser) => {
const userWallet = await findWallet(currentUser.id);
if (receiverId === currentUser.id) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot transfer to yourself');
}
const {amount, receiverId} = transferBody;
if (userWallet < 0 || userWallet == 0 || userWallet.balance < amount) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
}
const receiverWallet = await findWallet(receiverId);
const newBalance = userWallet.balance - amount;

const senderWalletBalance = userWallet.update({balance: newBalance - amount});
    // lets save the transaction
        await Transaction.create({
          paymentMethod: 'wallet',
          amount,
          status: 'success',
          userId: currentUser.id,
          alertType: 'debit'
      })
const receiverWalletBalance = receiverWallet.update({balance: receiverWallet.balance + amount});
    // lets save the transaction
    await Transaction.create({
      paymentMethod: 'wallet',
      amount,
      status: 'success',
      userId: receiverId,
      alertType: 'credit'
  })
}

/**
 * Verify the transaction
 * @param {Object} transactionBody
 * @param {number} currentUser
 * @returns {Promise<PaymentObject>}
 */
const verifyTransaction = async(reference, currentUser) => {
    // lets verify the transaction
    const verifyPaymentRef = await verifyPayment(reference);
    console.log(reference);
    if (!verifyPaymentRef.status) {
        throw new ApiError(httpStatus.BAD_GATEWAY, 'Unable to verify the transaction');
    }
    // find the transaction with the reference
    const transaction = await Transaction.findOne({ where: { reference } });
    if (!transaction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
    }
    if (transaction.paymentMethod === 'paystack') {
          // lets update the transaction status
    await transaction.update({ status: 'success' });
    // lets attach the reference to the order
    const order = await fetchOrderById(transaction.orderId);
    await order.update({ reference });
    return {
        message: 'Payment verify successful',
    }
    }
    // lets update the transaction status
    await transaction.update({ status: 'success' });
    // lets credit the user with amount now
    const userWallet = await findWallet(currentUser.id);
    userWallet.update({balance:transaction.amount + userWallet.balance});
    return {
        message: 'Wallet Payment verify successful',
    }
}


/**
 * Fetch all Order
 * @param {Object} filter
 * @param {string} filter.transactionId
 * @param {string} filter.status
 * @returns {Promise<*>}
 */
const fetchAllOrders = async (filter, options) => {
    const { docs, pages, total } = await Order.paginate({
      where: buildWhereCondition({ ...filter }),
      ...options,
      include: [
        {
          association: 'order_transaction',
          include: [
            {
              association: 'user_transaction',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
            }
          ]
        },
        {
          association: 'order_product',
          include: [
            {
              association: 'product_order',
            }
          ]
        }
      ]
    });
    return {
      orders: docs,
      pagination: {
        limit: options.paginate,
        page: options.page,
        totalResults: total,
        totalPages: pages,
      },
    };
};

/**
 * Fetch all Order
 * @param {Object} filter
 * @param {string} filter.transactionId
 * @param {string} filter.status
 * @param {string} filter.isWalletTransaction
 * @param {string} filter.alertType
 * @returns {Promise<*>}
 */
const fetchTransactions = async (filter, options) => {
    const { docs, pages, total } = await Transaction.paginate({
      where: buildWhereCondition({ ...filter }),
      ...options,
      include: [
        {
          association: 'user_transaction',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
        }
      ]
    });
    return {
      transactions: docs,
      pagination: {
        limit: options.paginate,
        page: options.page,
        totalResults: total,
        totalPages: pages,
      },
    };
};

/**
 * Fetch a Order by id
 * @param {number} id
 * @returns {Promise<ProductObject>}
 */
const fetchOrderById = async (id) => {
    const order = await Order.findByPk(id, {
      include: [
        {
          association: 'order_transaction',
          include: [
            {
              association: 'user_transaction',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
            }
          ]
        },
        {
          association: 'order_product',
          include: [
            {
              association: 'product_order',
            }
          ]
        }
      ]
    });
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }
    return order;
  };

/**
 * Fetch a Order by id
 * @param {number} id
 * @returns {Promise<ProductObject>}
 */
const fetchTransactionById = async (id) => {
    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          association: 'user_transaction',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
        }
      ]
    });
    if (!transaction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
    }
    return transaction;
  };

/**
 * Fetch a wallet by id
 * @param {number} id
 * @returns {Promise<ProductObject>}
 */
const fetchWalletById = async (id) => {
    const wallet = await Wallet.findByPk(id, {
      include: [
        {
          association: 'user_wallet',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage'],
        },
        {
          association: 'user_transactions',
        },

      ]
    });
    if (!wallet) {
      throw new ApiError(httpStatus.NOT_FOUND, 'wallet not found');
    }
    return wallet;
  };


  /**
   * Update tracker
   * @param {number} id
   * @param {Object} updateBody
   * @param {string} updateBody.deliveryNoteTracker
   * @param {boolean} updateBody.isDelivered
   * @returns {Promise<*>}
   */
  const updateOrderTracker = async (id, updateBody) => {
    const order = await fetchOrderById(id);
    Object.assign(order, updateBody);
    await order.save();
    return order;
  };


module.exports = {
    initializeTransaction,
    verifyTransaction,
    fetchTransactions,
    fetchAllOrders,
    fetchOrderById,
    updateOrderTracker,
    fetchTransactionById,
    initializeWalletTransaction,
    transferFromWallet,
    fetchWalletById,
    fetchTransactionById,
    transferFromWallet,
};
