const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    field: 'customer_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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

// ✅ MÉTODOS DE INSTANCIA
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

// ✅ MÉTODOS DE CLASE
Sale.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ where: { invoiceNumber } });
};

Sale.findByDateRange = function(startDate, endDate) {
  return this.findAll({
    where: {
      createdAt: {
        [sequelize.Op.between]: [startDate, endDate]
      },
      status: 'completed'
    },
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
    }
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

// 🚫 NO HAY ASOCIACIONES AQUÍ
// Todas las asociaciones se definen CENTRALIZADAMENTE en models/index.js
// mediante la función defineAssociations()

module.exports = Sale;
