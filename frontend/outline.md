# Sistema de Ventas - Estructura del Proyecto

## Archivos Principales

### index.html
- **Página Principal**: Dashboard del sistema
- **Componentes**: Métricas en tiempo real, gráficos de ventas, acceso rápido
- **Funcionalidades**: Vista general del negocio, notificaciones, acciones rápidas

### products.html
- **Gestión de Productos**: Catálogo completo de productos
- **Componentes**: Grid de productos, formularios CRUD, buscador avanzado
- **Funcionalidades**: Agregar, editar, eliminar, buscar, filtrar productos

### sales.html
- **Módulo de Ventas**: Interfaz de punto de venta
- **Componentes**: Carrito de compras, selector de productos, procesador de pagos
- **Funcionalidades**: Realizar ventas, aplicar descuentos, generar facturas

### customers.html
- **Gestión de Clientes**: Base de datos de clientes
- **Componentes**: Lista de clientes, historial de compras, sistema de fidelización
- **Funcionalidades**: Registrar clientes, ver historial, gestionar créditos

### reports.html
- **Reportes y Analytics**: Análisis de datos del negocio
- **Componentes**: Gráficos estadísticos, tablas de datos, filtros por período
- **Funcionalidades**: Generar reportes, exportar datos, ver tendencias

## Recursos Estáticos

### main.js
- **Lógica Principal**: Funciones del sistema de ventas
- **Gestión de Estado**: Variables globales y estado de la aplicación
- **API Simulada**: Datos de prueba para todas las funcionalidades
- **Utilidades**: Funciones auxiliares y helpers

### resources/
- **Imágenes de Productos**: Catálogo visual de productos de ejemplo
- **Iconos**: Iconografía personalizada del sistema
- **Logos**: Marca y elementos gráficos
- **Fondos**: Imágenes de fondo y texturas

## Estructura de Datos

### Productos
```javascript
{
  id: string,
  nombre: string,
  categoria: string,
  precio: number,
  stock: number,
  codigoBarras: string,
  imagen: string,
  descripcion: string
}
```

### Ventas
```javascript
{
  id: string,
  fecha: Date,
  cliente: object,
  productos: array,
  total: number,
  metodoPago: string,
  descuento: number,
  factura: string
}
```

### Clientes
```javascript
{
  id: string,
  nombre: string,
  email: string,
  telefono: string,
  direccion: string,
  historial: array,
  puntosFidelidad: number,
  credito: number
}
```

## Funcionalidades por Página

### Dashboard (index.html)
- [ ] Vista general de ventas del día/semana/mes
- [ ] Gráficos de tendencias de ventas
- [ ] Productos con stock bajo
- [ ] Últimas transacciones
- [ ] Accesos directos a funciones principales

### Productos (products.html)
- [ ] Grid visual de todos los productos
- [ ] Búsqueda y filtros avanzados
- [ ] Agregar nuevos productos
- [ ] Editar información existente
- [ ] Control de stock y alertas
- [ ] Generación de códigos de barras

### Ventas (sales.html)
- [ ] Selector de productos con búsqueda
- [ ] Carrito de compras dinámico
- [ ] Cálculo automático de totales
- [ ] Aplicación de descuentos
- [ ] Múltiples métodos de pago
- [ ] Generación de facturas

### Clientes (customers.html)
- [ ] Registro de nuevos clientes
- [ ] Base de datos completa
- [ ] Historial de compras por cliente
- [ ] Sistema de puntos y fidelización
- [ ] Gestión de créditos

### Reportes (reports.html)
- [ ] Ventas por período
- [ ] Productos más vendidos
- [ ] Análisis de ganancias
- [ ] Proyecciones y tendencias
- [ ] Exportación de datos

## Características Técnicas

### Responsive Design
- Adaptación a tablets (modo punto de venta)
- Interfaz móvil para consultas rápidas
- Diseño desktop para administración completa

### Animaciones y Efectos
- Transiciones suaves entre páginas
- Animaciones de carga y procesamiento
- Efectos hover en elementos interactivos
- Fondos animados con partículas

### Almacenamiento Local
- LocalStorage para datos de sesión
- Persistencia de configuraciones
- Backup automático de datos importantes
- Sincronización entre pestañas

### Accesibilidad
- Navegación por teclado
- Contraste adecuado para lectura
- Etiquetas descriptivas
- Modo de alto contraste disponible