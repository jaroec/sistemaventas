const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const User = require('./User');

const InventoryMovement = sequelize.define('InventoryMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    },
    field: 'product_id'
  },
  movementType: {
    type: DataTypes.ENUM('in', 'out', 'adjustment'),
    allowNull: false,
    field: 'movement_type'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'previous_stock',
    validate: {
      min: 0
    }
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'new_stock',
    validate: {
      min: 0
    }
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  referenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reference_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    field: 'user_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inventory_movements',
  timestamps: true,
  underscored: true,
  updatedAt: false // No necesitamos updated_at para movimientos
});

// Métodos de clase
InventoryMovement.getProductHistory = function(productId, limit = 50) {
  return this.findAll({
    where: { productId },
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'user' }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

InventoryMovement.getRecentMovements = function(limit = 20) {
  return this.findAll({
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'user' }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

InventoryMovement.getMovementsByType = function(movementType, startDate, endDate) {
  return this.findAll({
    where: {
      movementType,
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    include: [
      { model: Product, as: 'product' },
      { model: User, as: 'user' }
    ],
    order: [['createdAt', 'DESC']]
  });
};

InventoryMovement.getStockSummary = function(productId) {
  return this.findAll({
    where: { productId },
    attributes: [
      'productId',
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END")), 'totalIn'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END")), 'totalOut'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalMovements']
    ],
    group: ['productId'],
    raw: true
  });
};

module.exports = InventoryMovement;
