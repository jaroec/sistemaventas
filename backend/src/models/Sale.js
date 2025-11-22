const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Customer = require('./Customer');
const User = require('./User');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'invoice_number'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Customer,
      key: 'id'
    },
    field: 'customer_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'user_id'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
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
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'tax_amount',
    validate: {
      min: 0
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'credit'),
    allowNull: false,
    field: 'payment_method'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sales',
  timestamps: true,
  underscored: true
});

// Relaciones
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });
User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });

// Métodos de instancia
Sale.prototype.getSubtotal = function() {
  return this.totalAmount - this.taxAmount + this.discountAmount;
};

Sale.prototype.getTotalDiscount = function() {
  return this.discountAmount;
};

Sale.prototype.getTotalTax = function() {
  return this.taxAmount;
};

Sale.prototype.getNetAmount = function() {
  return this.totalAmount;
};

// Métodos de clase
Sale.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ 
    where: { invoiceNumber },
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'user' }
    ]
  });
};

Sale.findByDateRange = function(startDate, endDate) {
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'user' }
    ],
    order: [['createdAt', 'DESC']]
  });
};

Sale.getDailySales = function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startOfDay, endOfDay]
      },
      status: 'completed'
    },
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'user' }
    ]
  });
};

Sale.getSalesSummary = function(startDate, endDate) {
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'averageTicket'],
      [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalDiscounts'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTaxes']
    ],
    raw: true
  });
};

Sale.getTopProducts = function(startDate, endDate, limit = 10) {
  const SaleItem = require('./SaleItem');
  const Product = require('./Product');
  
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
    include: [{
      model: SaleItem,
      include: [{
        model: Product,
        attributes: ['id', 'name', 'categoryId']
      }]
    }],
    limit: limit
  });
};

module.exports = Sale;