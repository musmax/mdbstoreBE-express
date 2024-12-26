const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  description: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.INTEGER,
  },
  availableColor: {
    type: DataTypes.JSON,
  },
  isOutOfStock: {
    type: DataTypes.BOOLEAN,
  },
  availableQuantity: {
    type: DataTypes.INTEGER,
  },
  discount: {
    type: DataTypes.FLOAT,
  },
});

module.exports = { Product };
