const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('order', {
  quantity: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = { Order };
