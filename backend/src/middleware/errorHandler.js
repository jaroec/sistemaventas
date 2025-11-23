const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    return res.status(400).json({
      error: 'Validación fallida',
      message: 'Los datos proporcionados no son válidos',
      errors
    });
  }

  // Error de Sequelize - Constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflicto',
      message: 'El registro ya existe',
      field: err.errors[0]?.path,
      value: err.errors[0]?.value
    });
  }

  // Error de Sequelize - Foreign Key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Referencia inválida',
      message: 'La referencia a otro registro no existe',
      table: err.table,
      field: err.fields?.[0]
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token proporcionado no es válido'
    });
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'El token ha expirado'
    });
  }

  // Error de multer (archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el tamaño máximo permitido'
    });
  }

  // Error de multer - tipo de archivo
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Archivo no esperado',
      message: 'Tipo de archivo no permitido'
    });
  }

  // Error de validación personalizado
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validación fallida',
      message: err.message,
      details: err.details
    });
  }

  // Error de negocio personalizado
  if (err.name === 'BusinessError') {
    return res.status(400).json({
      error: 'Error de negocio',
      message: err.message,
      code: err.code
    });
  }

  // Error de no encontrado
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'No encontrado',
      message: err.message
    });
  }

  // Error de conflicto
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflicto',
      message: err.message
    });
  }

  // Error de base de datos
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      message: 'No se pudo conectar a la base de datos'
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    error: 'Error interno',
    message: process.env.NODE_ENV === 'production' 
      ? 'Algo salió mal' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

module.exports = errorHandler;
