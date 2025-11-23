const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'cashier'),
    defaultValue: 'cashier',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (user) => {
      if (user.username) {
        user.username = user.username.toLowerCase().trim();
      }
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
    }
  }
});

// ✅ MÉTODOS DE INSTANCIA (Sin asociaciones)
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

// ✅ MÉTODOS DE CLASE (Sin asociaciones)
User.generateHash = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  return await bcrypt.hash(password, saltRounds);
};

User.findByEmail = function(email) {
  return this.findOne({ where: { email: email.toLowerCase().trim() } });
};

User.findByUsername = function(username) {
  return this.findOne({ where: { username: username.toLowerCase().trim() } });
};

// ✅ HOOKS (Sin asociaciones)
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await User.generateHash(user.passwordHash);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await User.generateHash(user.passwordHash);
  }
});

// 🚫 NO HAY ASOCIACIONES AQUÍ
// Todas las asociaciones se definen CENTRALIZADAMENTE en models/index.js
// mediante la función defineAssociations()

module.exports = User;
