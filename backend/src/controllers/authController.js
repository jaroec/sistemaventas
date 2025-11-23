const { User } = require('../models');
const { generateTokens } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs');

// Registro de usuario
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { username, email, password, fullName, role = 'cashier' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username: username.toLowerCase().trim() },
          { email: email.toLowerCase().trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'El usuario o email ya existe'
      });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      passwordHash: password, // El hook beforeCreate encriptará la contraseña
      fullName,
      role
    });

    // Generar tokens
    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      tokens
    });
  } catch (error) {
    next(error);
  }
};

// Login de usuario
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Buscar usuario por username o email
    const user = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username: username.toLowerCase().trim() },
          { email: username.toLowerCase().trim() }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta está desactivada. Contacta al administrador.'
      });
    }

    // Actualizar último login
    await user.update({ lastLogin: new Date() });

    // Generar tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      tokens
    });
  } catch (error) {
    next(error);
  }
};

// Logout de usuario
const logout = async (req, res, next) => {
  try {
    // En una implementación más compleja, aquí se invalidaría el token
    // Por ahora, simplemente respondemos con éxito
    res.json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se pudo encontrar el usuario'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { fullName, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se pudo encontrar el usuario'
      });
    }

    // Verificar si el email ya existe (excluyendo el usuario actual)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id: { [User.sequelize.Op.ne]: user.id }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Actualizar usuario
    await user.update({
      fullName: fullName || user.fullName,
      email: email || user.email
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cambiar contraseña
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se pudo encontrar el usuario'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    await user.update({ passwordHash: newPassword });

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Se requiere un refresh token'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El refresh token no es válido'
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Tokens refrescados exitosamente',
      tokens
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El refresh token no es válido o ha expirado'
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};
