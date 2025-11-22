const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Sale = require('./Sale');
const Product = require('./Product');

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sale,
      key: 'id'
    },
    field: 'sale_id'
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
    validate: {
      min: 0
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'discount_amount',
    validate: {
      min: 0
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sale_items',
  timestamps: true,
  underscored: true,
  updatedAt: false // No necesitamos updated_at para items de venta
});

// Relaciones
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });

// Métodos de instancia
SaleItem.prototype.getTotal = function() {
  return this.subtotal - this.discountAmount;
};

SaleItem.prototype.getUnitDiscount = function() {
  return this.discountAmount / this.quantity;
};

// Métodos de clase
SaleItem.getTopProducts = function(startDate, endDate, limit = 10) {
  return this.findAll({
    attributes: [
      'productId',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales']
    ],
    include: [{
      model: Sale,
      where: {
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: []
    }, {
      model: Product,
      attributes: ['id', 'name', 'categoryId']
    }],
    group: ['productId', 'product.id', 'product.name', 'product.categoryId'],
    order: [[sequelize.literal('totalQuantity'), 'DESC']],
    limit: limit
  });
};

SaleItem.getProductSales = function(productId, startDate, endDate) {
  return this.findAll({
    where: { productId },
    include: [{
      model: Sale,
      where: {
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        status: 'completed'
      }
    }],
    order: [['createdAt', 'DESC']]
  });
};

module.exports = SaleItem;