const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');

const CostHistory = sequelize.define('CostHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id'
  },
  oldCostPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'old_cost_price'
  },
  newCostPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'new_cost_price'
  },
  changeReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'change_reason'
  },
  changedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'changed_by'
  },
  oldSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'old_sale_price'
  },
  newSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'new_sale_price'
  }
}, {
  tableName: 'cost_history',
  timestamps: true,
  underscored: true
});


module.exports = CostHistory;
