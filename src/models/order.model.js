const sequelizePaginate = require('sequelize-paginate');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('order', {
  amount: {
    type: DataTypes.INTEGER,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
  },
  reference: {
    type: DataTypes.STRING,
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deliveryNoteTracker: {
    type: DataTypes.STRING,
  },
});

sequelizePaginate.paginate(Order);

module.exports = { Order };
