const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (category) => {
      if (category.name) {
        category.name = category.name.trim();
      }
    }
  }
});

// Métodos de clase
Category.findByName = function(name) {
  return this.findOne({ where: { name: name.trim() } });
};

Category.getActive = function() {
  return this.findAll({ where: { isActive: true } });
};

module.exports = Category;
