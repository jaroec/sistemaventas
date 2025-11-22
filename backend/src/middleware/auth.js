const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Se requiere un token de autenticación' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Token inválido o usuario inactivo' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Token expirado' 
      });
    }
    
    console.error('Error en autenticación:', error);
    res.status(500).json({ 
      error: 'Error interno', 
      message: 'Error al procesar la autenticación' 
    });
  }
};

// Middleware de autorización por roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Usuario no autenticado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Prohibido', 
        message: `Se requiere uno de estos roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware para verificar propiedad o rol de admin
const ownerOrAdmin = (userIdField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Usuario no autenticado' 
      });
    }

    const requestedUserId = req.params[userIdField] || req.body[userIdField];
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.id === parseInt(requestedUserId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ 
        error: 'Prohibido', 
        message: 'No tienes permisos para esta acción' 
      });
    }

    next();
  };
};

// Middleware opcional para rutas públicas
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Ignorar errores de token en autenticación opcional
    next();
  }
};

// Generar tokens
const generateTokens = (user) => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role 
  };
  
  const accessToken = jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  const refreshToken = jwt.sign(
    payload, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Verificar refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticate,
  authorize,
  ownerOrAdmin,
  optionalAuth,
  generateTokens,
  verifyRefreshToken
};
