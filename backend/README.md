# Sistema de Ventas - Backend

Backend completo para sistema de punto de ventas, desarrollado con Node.js, Express y PostgreSQL.

## Características

- ✅ **API RESTful** completa con autenticación JWT
- ✅ **Base de datos PostgreSQL** con esquema optimizado
- ✅ **ORM Sequelize** para manejo de modelos
- ✅ **Validación de datos** con express-validator
- ✅ **Seguridad** con helmet, rate limiting y CORS
- ✅ **Documentación** integrada con Swagger
- ✅ **Manejo de errores** centralizado
- ✅ **Logging** estructurado
- ✅ **Testing** con Jest y Supertest

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Sequelize** - ORM para Node.js
- **JWT** - Autenticación por tokens
- **bcryptjs** - Hashing de contraseñas
- **Joi** - Validación de esquemas
- **Winston** - Logging
- **Helmet** - Seguridad de headers
- **CORS** - Control de acceso
- **Rate Limiting** - Protección contra ataques

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticación
│   │   ├── productController.js # Controlador de productos
│   │   ├── saleController.js    # Controlador de ventas
│   │   ├── customerController.js # Controlador de clientes
│   │   └── categoryController.js # Controlador de categorías
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticación
│   │   ├── errorHandler.js      # Manejo de errores
│   │   └── notFound.js          # Manejo de rutas no encontradas
│   ├── models/
│   │   ├── User.js              # Modelo de usuario
│   │   ├── Product.js           # Modelo de producto
│   │   ├── Sale.js              # Modelo de venta
│   │   ├── Customer.js          # Modelo de cliente
│   │   ├── Category.js          # Modelo de categoría
│   │   └── index.js             # Índice de modelos
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   ├── products.js          # Rutas de productos
│   │   ├── sales.js             # Rutas de ventas
│   │   ├── customers.js         # Rutas de clientes
│   │   └── categories.js        # Rutas de categorías
│   └── server.js                # Servidor principal
├── scripts/
│   ├── init-database.js         # Script de inicialización
│   └── seed-data.js             # Script de datos de prueba
├── database/
│   └── schema.sql               # Esquema de base de datos
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables de entorno
├── package.json                 # Dependencias y scripts
└── README.md                    # Este archivo
```

## Instalación

### Requisitos Previos

- **Node.js** (v14 o superior)
- **PostgreSQL** (v12 o superior)
- **npm** o **yarn**

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/sistema-ventas-backend.git
cd sistema-ventas-backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Crear base de datos en PostgreSQL**
```sql
CREATE DATABASE sistema_ventas;
CREATE USER app_user WITH PASSWORD 'app_password_123';
GRANT ALL PRIVILEGES ON DATABASE sistema_ventas TO app_user;
```

5. **Inicializar base de datos**
```bash
npm run init-db
```

6. **Poblar con datos de prueba (opcional)**
```bash
npm run seed
```

7. **Iniciar servidor**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Variables de Entorno

### Configuración del Servidor
```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
```

### Configuración de Base de Datos
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_ventas
DB_USER=app_user
DB_PASSWORD=app_password_123
DB_SSL=false
```

### Configuración de JWT
```env
JWT_SECRET=tu_secreto_jwt_aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=tu_refresh_secret_aqui
JWT_REFRESH_EXPIRES_IN=7d
```

### Configuración de Seguridad
```env
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5500
CORS_CREDENTIALS=true
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login de usuarios
- `POST /api/auth/logout` - Logout de usuarios
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/change-password` - Cambiar contraseña

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/search` - Buscar productos
- `GET /api/products/low-stock` - Productos con stock bajo

### Ventas
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id` - Actualizar venta
- `DELETE /api/sales/:id` - Cancelar venta
- `GET /api/sales/summary` - Resumen de ventas

### Clientes
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obtener cliente
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente
- `GET /api/customers/search` - Buscar clientes

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría
- `POST /api/categories` - Crear categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

## Modelos de Base de Datos

### User (Usuario)
```javascript
{
  id: INTEGER,
  username: STRING,
  email: STRING,
  passwordHash: STRING,
  fullName: STRING,
  role: ENUM('admin', 'manager', 'cashier'),
  isActive: BOOLEAN,
  lastLogin: DATE,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Product (Producto)
```javascript
{
  id: INTEGER,
  name: STRING,
  description: TEXT,
  barcode: STRING,
  categoryId: INTEGER,
  price: DECIMAL,
  cost: DECIMAL,
  stock: INTEGER,
  minStock: INTEGER,
  imageUrl: STRING,
  isActive: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Sale (Venta)
```javascript
{
  id: INTEGER,
  invoiceNumber: STRING,
  customerId: INTEGER,
  userId: INTEGER,
  totalAmount: DECIMAL,
  discountAmount: DECIMAL,
  taxAmount: DECIMAL,
  paymentMethod: ENUM('cash', 'card', 'transfer', 'credit'),
  status: ENUM('pending', 'completed', 'cancelled'),
  notes: TEXT,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Customer (Cliente)
```javascript
{
  id: INTEGER,
  name: STRING,
  email: STRING,
  phone: STRING,
  address: TEXT,
  loyaltyPoints: INTEGER,
  creditBalance: DECIMAL,
  isActive: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

## Seguridad

### Autenticación
- **JWT Tokens** para autenticación stateless
- **Refresh Tokens** para renovación de sesión
- **Bcrypt** para hashing de contraseñas

### Autorización
- **Roles** basados en permisos (admin, manager, cashier)
- **Middleware** para protección de rutas
- **Owner validation** para recursos propios

### Seguridad de Aplicación
- **Helmet** para headers de seguridad
- **Rate Limiting** para prevenir ataques de fuerza bruta
- **CORS** configurado para origen específico
- **Input Validation** en todos los endpoints
- **SQL Injection Prevention** con Sequelize ORM

## Scripts Disponibles

```bash
# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Inicializar base de datos
npm run init-db

# Poblar base de datos con datos de prueba
npm run seed

# Ejecutar tests
npm test

# Linting
npm run lint

# Formatear código
npm run format
```

## Testing

### Ejecutar tests
```bash
npm test
```

### Ejecutar tests en modo watch
```bash
npm test -- --watch
```

### Ejecutar tests con coverage
```bash
npm test -- --coverage
```

## Credenciales de Prueba

Después de ejecutar `npm run seed`, estarán disponibles los siguientes usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@sistema.com | admin123 |
| Manager | manager@sistema.com | manager123 |
| Cashier | cajero1@sistema.com | cajero123 |

## Integración con Frontend

El backend está diseñado para trabajar con el frontend del sistema de ventas. Asegúrate de:

1. Configurar correctamente las variables de entorno de CORS
2. Usar el mismo dominio/puerto en ambas aplicaciones
3. Manejar correctamente los tokens JWT en el frontend

## Despliegue

### Producción

1. **Variables de entorno**
```bash
NODE_ENV=production
PORT=3000
```

2. **Base de datos**
- Usar una instancia de PostgreSQL en producción
- Configurar backups automáticos
- Optimizar para alto tráfico

3. **Seguridad**
- Usar HTTPS
- Configurar firewall
- Monitorear logs
- Actualizar dependencias regularmente

### Docker (Próximamente)
```dockerfile
# Dockerfile en desarrollo
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Para soporte técnico o preguntas:
- Email: soporte@sistemaventas.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/sistema-ventas-backend/issues)

## Changelog

### v1.0.0
- ✅ API REST completa
- ✅ Autenticación JWT
- ✅ Gestión de productos
- ✅ Sistema de ventas
- ✅ Gestión de clientes
- ✅ Reportes básicos
- ✅ Seguridad implementada

---

**Desarrollado con ❤️ para la comunidad de desarrolladores**