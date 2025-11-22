# Sistema de Cálculo de Ganancias - Documentación

## Descripción General

Este documento describe el sistema completo de cálculo de ganancias implementado para el Sistema de Ventas. El sistema resuelve el problema identificado de no poder calcular ganancias reales sin precios de costo, implementando la fórmula matemática: **PV = PC / (1 - % de ganancias)**.

## Características Principales

### 1. Cálculo Automático de Precios
- **Fórmula implementada**: PV = PC / (1 - % de ganancias)
- **Validación automática**: Márgenes entre 0% y 99.99%
- **Actualización en tiempo real**: Precios se recalculan automáticamente cuando cambian costos o márgenes

### 2. Gestión de Márgenes de Ganancia
- **Márgenes configurables por producto**: Cada producto puede tener su propio margen de ganancia
- **Precios manuales opcionales**: Posibilidad de sobrescribir el precio calculado
- **Actualización masiva**: Capacidad de actualizar márgenes de múltiples productos simultáneamente

### 3. Seguimiento de Historial de Costos
- **Registro de cambios**: Todos los cambios de precios de costo son registrados
- **Auditoría completa**: Quién hizo los cambios, cuándo y por qué
- **Análisis de tendencias**: Visualización de cómo han cambiado los costos con el tiempo

### 4. Análisis de Rentabilidad
- **Dashboard de ganancias**: Métricas en tiempo real de rentabilidad total
- **Productos más rentables**: Identificación de los productos con mayor contribución de ganancias
- **Alertas de márgenes bajos**: Productos con márgenes por debajo del 20%
- **Análisis por categoría**: Rentabilidad agrupada por categorías de productos

## Modelo de Datos

### Producto (Actualizado)
```javascript
{
  id: Integer,
  name: String,
  description: Text,
  costPrice: Decimal,           // Precio de costo
  profitMargin: Decimal,        // Margen de ganancia (%)
  calculatedSalePrice: Decimal, // Precio calculado automáticamente
  manualSalePrice: Decimal,     // Precio manual (opcional)
  isUsingManualPrice: Boolean,  // Indica si usa precio manual
  currentStock: Integer,
  minimumStock: Integer,
  barcode: String,
  status: Enum('active', 'inactive', 'discontinued')
}
```

### Historial de Costos (Nuevo)
```javascript
{
  id: Integer,
  productId: Integer,          // ID del producto
  oldCostPrice: Decimal,       // Precio de costo anterior
  newCostPrice: Decimal,       // Nuevo precio de costo
  oldSalePrice: Decimal,       // Precio de venta anterior
  newSalePrice: Decimal,       // Nuevo precio de venta
  changeReason: String,        // Razón del cambio
  changedBy: String,           // Usuario que hizo el cambio
  createdAt: DateTime          // Fecha y hora del cambio
}
```

## Fórmula de Cálculo

La fórmula implementada es:
```
Precio de Venta = Precio de Costo / (1 - Margen de Ganancia/100)
```

### Ejemplos:
- **Producto con costo de $50 y margen del 30%**:
  - PV = 50 / (1 - 0.30) = 50 / 0.70 = $71.43
- **Producto con costo de $100 y margen del 50%**:
  - PV = 100 / (1 - 0.50) = 100 / 0.50 = $200.00

## API Endpoints

### Gestión de Productos
- `GET /api/products` - Obtener todos los productos con información de ganancias
- `GET /api/products/:id` - Obtener producto específico con detalles de ganancia
- `POST /api/products` - Crear nuevo producto con cálculo automático de precio
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Gestión de Precios
- `PUT /api/products/:id/pricing` - Actualizar precios y márgenes
- `POST /api/products/:id/manual-price` - Establecer precio manual
- `POST /api/products/:id/calculated-price` - Usar precio calculado automáticamente

### Análisis de Ganancias
- `GET /api/products/profit-analysis` - Obtener análisis completo de ganancias
- `GET /api/products/:id/cost-history` - Obtener historial de cambios de costo
- `POST /api/products/bulk-update-margins` - Actualizar márgenes masivamente

### Búsqueda
- `GET /api/products/search?query=term` - Buscar productos

## Interfaz de Usuario

### Dashboard de Ganancias
- **Valor Total del Inventario**: Suma del valor de todos los productos en stock
- **Valor de Costo Total**: Suma del costo de todos los productos en stock
- **Ganancia Total**: Diferencia entre valor de inventario y costo total
- **Margen Promedio**: Margen de ganancia promedio de todos los productos

### Gestión de Productos
- **Tabla de productos** con información de ganancias en tiempo real
- **Edición rápida** de costos, márgenes y precios manuales
- **Indicadores visuales** de márgenes bajos, medios y altos
- **Historial de cambios** accesible desde cada producto

### Acciones Rápidas
- **Actualización masiva de márgenes** por categoría o todos los productos
- **Identificación de productos con bajo margen** (< 20%)
- **Visualización de productos más rentables**
- **Búsqueda avanzada** de productos

## Validaciones y Seguridad

### Validaciones de Negocio
- **Márgenes válidos**: Solo se permiten márgenes entre 0% y 99.99%
- **Precios positivos**: Todos los precios deben ser mayores a 0
- **Stock no negativo**: No se permiten cantidades negativas en stock
- **Códigos de barras únicos**: Validación de duplicados

### Seguridad
- **Autenticación JWT**: Todas las rutas protegidas requieren token válido
- **Auditoría completa**: Registro de todos los cambios con usuario y timestamp
- **Validación de entrada**: Sanitización de todos los datos de entrada
- **Rate limiting**: Protección contra ataques de fuerza bruta

## Mejores Prácticas Implementadas

### Cálculo de Precios
- **Precisión decimal**: Uso de DECIMAL(10,2) para precios monetarios
- **Redondeo automático**: Precios calculados se redondean a 2 decimales
- **Validación de márgenes**: Prevención de márgenes inválidos que causarían errores

### Seguimiento de Cambios
- **Historial completo**: Todos los cambios de costo son registrados
- **Contexto de cambios**: Razón y usuario que realizó el cambio
- **Valores antiguos y nuevos**: Registro completo para auditoría

### Rendimiento
- **Cálculo eficiente**: Fórmula implementada en base de datos y aplicación
- **Índices apropiados**: Optimización de consultas frecuentes
- **Carga diferida**: Análisis de ganancias se calcula bajo demanda

## Ejemplos de Uso

### Crear Producto con Margen Específico
```javascript
POST /api/products
{
  "name": "Laptop Gaming",
  "costPrice": 800.00,
  "profitMargin": 25.00,
  "currentStock": 10,
  "categoryId": 1
}
// Precio calculado automáticamente: $1066.67
```

### Actualizar Margen de Ganancia
```javascript
PUT /api/products/1/pricing
{
  "profitMargin": 30.00
}
// Nuevo precio calculado: $1142.86
```

### Establecer Precio Manual
```javascript
POST /api/products/1/manual-price
{
  "price": 1200.00
}
// Precio manual establecido, margen real: 33.33%
```

## Solución de Problemas

### Precio Calculado Incorrecto
- Verificar que el margen esté entre 0% y 99.99%
- Confirmar que el precio de costo sea mayor a 0
- Revisar logs de la aplicación para errores

### Margen No Aplicado
- Verificar que no se esté usando precio manual
- Confirmar que el producto esté activo
- Revisar validaciones del modelo

### Historial No Registrado
- Verificar que el cambio de costo sea significativo
- Confirmar que el usuario esté autenticado
- Revisar configuración de la base de datos

## Futuras Mejoras

### Análisis Avanzado
- **Predicciones de ganancias** basadas en tendencias históricas
- **Análisis estacional** de rentabilidad por períodos
- **Comparación con competencia** y sugerencias de precios

### Automatización
- **Ajustes automáticos** de márgenes basados en rotación de inventario
- **Alertas proactivas** de productos con márgenes decrecientes
- **Sincronización** con sistemas de contabilidad

### Integraciones
- **APIs de proveedores** para actualización automática de costos
- **Sistemas de contabilidad** para reconciliación automática
- **Paneles de administración** avanzados para gerencia

## Conclusión

El sistema de cálculo de ganancias implementado resuelve completamente el problema identificado, proporcionando:

1. **Cálculo preciso** de precios de venta basado en costos y márgenes deseados
2. **Seguimiento completo** de cambios y auditoría
3. **Análisis en tiempo real** de rentabilidad
4. **Interfaz intuitiva** para gestión de márgenes
5. **Flexibilidad** para precios manuales cuando sea necesario

El sistema está diseñado para escalar y adaptarse a las necesidades cambiantes del negocio, proporcionando las herramientas necesarias para una gestión efectiva de la rentabilidad.