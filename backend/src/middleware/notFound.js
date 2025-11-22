const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;