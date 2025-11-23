const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
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
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'contact_person'
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
  tableName: 'suppliers',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (supplier) => {
      if (supplier.name) {
        supplier.name = supplier.name.trim();
      }
      if (supplier.email) {
        supplier.email = supplier.email.toLowerCase().trim();
      }
    }
  }
});

// Métodos de clase
Supplier.findByName = function(name) {
  return this.findOne({ where: { name: name.trim() } });
};

Supplier.getActive = function() {
  return this.findAll({ where: { isActive: true } });
};

module.exports = Supplier;
