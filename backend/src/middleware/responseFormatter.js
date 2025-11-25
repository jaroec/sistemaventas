/**
 * Middleware para formatear todas las respuestas de manera consistente
 * 
 * Uso:
 * - Todas las respuestas tendrán estructura: { success: true, data: {...} }
 * - Automáticamente se agregan timestamp y metadatos
 */

const responseFormatter = (req, res, next) => {
  // Guardar la función original
  const originalJson = res.json;

  // Reemplazar con versión personalizada
  res.json = function(data) {
    // Si es una respuesta de error, dejarla como está
    if (data && (data.error || (data.statusCode && data.statusCode >= 400))) {
      console.log('📤 Respuesta de Error:', data);
      return originalJson.call(this, data);
    }

    // Para respuestas exitosas, formatear consistentemente
    const formattedResponse = {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    console.log(`✅ ${req.method} ${req.path} - Respuesta formateada`);
    return originalJson.call(this, formattedResponse);
  };

  next();
};

module.exports = responseFormatter;
