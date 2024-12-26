const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  amount: {
    type: DataTypes.INTEGER,
    trim: true,
  },
  status: {
    type: DataTypes.STRING,
  },
  reference: {
    type: DataTypes.STRING,
  },
  paymentMethod: {
    type: DataTypes.ENUM('paystack', 'flutterwave', 'monify', 'wallet'),
  },
  isWalletTransaction: {
    type: DataTypes.BOOLEAN,
  },
  alertType: {
    type: DataTypes.ENUM('credit', 'debit', 'reverse', 'overdraft'),
  },
});

module.exports = { Transaction };
