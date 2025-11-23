const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [5, 20]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'loyalty_points',
    validate: {
      min: 0
    }
  },
  creditBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'credit_balance',
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (customer) => {
      if (customer.name) {
        customer.name = customer.name.trim();
      }
      if (customer.email) {
        customer.email = customer.email.toLowerCase().trim();
      }
      if (customer.phone) {
        customer.phone = customer.phone.trim();
      }
    }
  }
});

// ✅ MÉTODOS DE INSTANCIA
Customer.prototype.addLoyaltyPoints = async function(points) {
  this.loyaltyPoints += points;
  await this.save();
  return this.loyaltyPoints;
};

Customer.prototype.redeemLoyaltyPoints = async function(points) {
  if (this.loyaltyPoints < points) {
    throw new Error('Puntos de fidelidad insuficientes');
  }
  this.loyaltyPoints -= points;
  await this.save();
  return this.loyaltyPoints;
};

Customer.prototype.addCredit = async function(amount) {
  this.creditBalance += amount;
  await this.save();
  return this.creditBalance;
};

Customer.prototype.useCredit = async function(amount) {
  if (this.creditBalance < amount) {
    throw new Error('Crédito insuficiente');
  }
  this.creditBalance -= amount;
  await this.save();
  return this.creditBalance;
};

// ✅ MÉTODOS DE CLASE
Customer.findByEmail = function(email) {
  return this.findOne({ where: { email: email.toLowerCase().trim() } });
};

Customer.findByPhone = function(phone) {
  return this.findOne({ where: { phone: phone.trim() } });
};

Customer.search = function(query) {
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.iLike]: `%${query}%` } },
        { email: { [sequelize.Op.iLike]: `%${query}%` } },
        { phone: { [sequelize.Op.iLike]: `%${query}%` } }
      ]
    }
  });
};

Customer.getWithCredit = function() {
  return this.findAll({
    where: {
      creditBalance: {
        [sequelize.Op.gt]: 0
      }
    },
    order: [['creditBalance', 'DESC']]
  });
};

// ⚠️ NO AGREGAR ASOCIACIONES AQUÍ - Se definen en index.js
module.exports = Customer;
