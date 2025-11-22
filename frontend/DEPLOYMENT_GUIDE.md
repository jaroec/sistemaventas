# Guía de Despliegue - Sistema de Ventas Completo

## 🚀 Descripción General

Este documento proporciona una guía completa para desplegar el Sistema de Ventas con backend en PostgreSQL y frontend web. El sistema está completamente funcional y listo para usar.

## 📁 Estructura del Proyecto

```
/mnt/okcomputer/output/
├── 📁 Frontend (Listo para usar)
│   ├── index.html              # Dashboard principal
│   ├── products.html           # Gestión de productos
│   ├── sales.html              # Punto de venta
│   ├── customers.html          # Gestión de clientes
│   ├── reports.html            # Reportes y analytics
│   ├── login.html              # Página de login
│   ├── main.js                 # Lógica principal del frontend
│   └── 📁 resources/           # Recursos estáticos
│
├── 📁 Backend (Completo)
│   ├── src/
│   │   ├── config/             # Configuración de base de datos
│   │   ├── controllers/        # Controladores de la API
│   │   ├── middleware/         # Middleware de autenticación
│   │   ├── models/             # Modelos de Sequelize
│   │   ├── routes/             # Rutas de la API
│   │   └── server.js           # Servidor principal
│   ├── scripts/                # Scripts de inicialización
│   ├── database/               # Esquema de PostgreSQL
│   └── package.json            # Dependencias del backend
│
└── 📄 Documentación
    ├── README.md                 # Documentación principal
    ├── DEPLOYMENT_GUIDE.md       # Esta guía
    ├── design.md                 # Diseño visual
    ├── interaction.md            # Diseño de interacción
    └── outline.md                # Estructura del proyecto
```

## 🛠️ Requisitos Previos

### Para el Frontend:
- **Navegador web moderno** (Chrome, Firefox, Safari, Edge)
- **No requiere instalación** - es una aplicación web estática

### Para el Backend:
- **Node.js** v14 o superior
- **PostgreSQL** v12 o superior
- **npm** o **yarn**
- **Sistema operativo** Windows, macOS o Linux

## 🚀 Instrucciones de Despliegue

### Opción 1: Despliegue Completo (Frontend + Backend)

#### Paso 1: Preparar el Backend

1. **Instalar PostgreSQL**
```bash
# En Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# En macOS (usando Homebrew)
brew install postgresql
brew services start postgresql

# En Windows
# Descargar e instalar desde https://www.postgresql.org/download/windows/
```

2. **Crear base de datos y usuario**
```sql
-- Conectar a PostgreSQL como usuario postgres
sudo -u postgres psql

-- Crear base de datos
CREATE DATABASE sistema_ventas;

-- Crear usuario
CREATE USER app_user WITH PASSWORD 'app_password_123';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE sistema_ventas TO app_user;

-- Salir
\q
```

3. **Instalar y configurar el backend**
```bash
# Ir al directorio del backend
cd /mnt/okcomputer/output/backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus configuraciones (opcional)
# nano .env
```

4. **Inicializar base de datos**
```bash
# Inicializar esquema de base de datos
npm run init-db

# Poblar con datos de prueba (opcional)
npm run seed
```

5. **Iniciar servidor backend**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El backend estará corriendo en: `http://localhost:3000`

#### Paso 2: Configurar el Frontend

1. **El frontend ya está configurado** para conectarse con el backend en `http://localhost:3000`

2. **Abrir el sistema**:
   - Abrir `login.html` en el navegador
   - O usar un servidor local:
     ```bash
     # En el directorio principal
     python -m http.server 5500
     # O
     npx serve .
     ```

3. **Acceder al sistema**:
   - URL: `http://localhost:5500/login.html`
   - Credenciales de prueba:
     - Admin: `admin@sistema.com` / `admin123`
     - Manager: `manager@sistema.com` / `manager123`
     - Cajero: `cajero1@sistema.com` / `cajero123`

### Opción 2: Solo Frontend (Modo Demo)

Si solo quieres usar el frontend con datos locales:

1. **Abrir directamente** cualquier archivo HTML
2. **El sistema funcionará** con datos almacenados en LocalStorage
3. **No requiere backend** ni base de datos

## 📊 Datos de Prueba Incluidos

Al ejecutar `npm run seed`, se crean automáticamente:

### Usuarios
- **Admin**: Control total del sistema
- **Manager**: Gestión de productos y reportes
- **Cajero**: Solo punto de venta

### Productos de Demostración
- Laptop Gamer Pro ($1,299.99)
- Smartphone X12 ($699.99)
- Manzanas Orgánicas ($3.99)
- Camisa Premium ($49.99)
- Silla Oficina Ergonómica ($299.99)
- Auriculares Bluetooth ($89.99)
- Pasta Dental Premium ($4.99)
- Jeans Clásicos ($79.99)

### Clientes de Demostración
- Juan Pérez (150 puntos de fidelidad)
- María García (280 puntos, $100 crédito)
- Carlos Rodríguez (75 puntos)
- Ana López (420 puntos, $50 crédito)
- Luis Martínez (95 puntos, $25 crédito)

### Ventas de Demostración
- Ventas registradas con diferentes métodos de pago
- Histórico completo para análisis
- Datos para reportes y gráficos

## 🔧 Configuración Adicional

### Variables de Entorno Importantes

```env
# Backend (.env)
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=sistema_ventas
DB_USER=app_user
DB_PASSWORD=app_password_123
JWT_SECRET=tu_secreto_jwt_aqui

# Frontend (configurado en main.js)
API_URL=http://localhost:3000/api
```

### Seguridad

1. **Cambiar contraseñas por defecto**
2. **Usar HTTPS en producción**
3. **Configurar firewall**
4. **Actualizar dependencias regularmente**

### Optimización para Producción

1. **Base de datos**:
   - Usar PostgreSQL en producción
   - Configurar backups automáticos
   - Optimizar índices

2. **Backend**:
   - Usar PM2 para gestión de procesos
   - Configurar logs
   - Implementar monitoreo

3. **Frontend**:
   - Minificar archivos
   - Usar CDN para recursos
   - Implementar caching

## 🐳 Docker (Opcional)

Para desplegar con Docker:

```bash
# Construir y ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📚 Características Implementadas

### ✅ Frontend
- **Dashboard** con métricas en tiempo real
- **Gestión de productos** completa (CRUD)
- **Punto de venta** con carrito dinámico
- **Gestión de clientes** con fidelización
- **Reportes** con gráficos interactivos
- **Diseño responsive** para todos los dispositivos
- **Autenticación** con diferentes roles

### ✅ Backend
- **API REST** completa y documentada
- **Autenticación JWT** segura
- **Base de datos PostgreSQL** optimizada
- **ORM Sequelize** para manejo de datos
- **Validación** de entrada de datos
- **Manejo de errores** centralizado
- **Logging** estructurado
- **Seguridad** con rate limiting y CORS

### ✅ Base de Datos
- **Esquema completo** para sistema de ventas
- **Relaciones** bien definidas
- **Índices** para optimización
- **Triggers** para automatización
- **Vistas** para reportes
- **Seguridad** con roles y permisos

## 🔍 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/register` - Registro de usuario
- `GET /api/auth/profile` - Perfil del usuario
- `PUT /api/auth/change-password` - Cambiar contraseña

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/search` - Buscar productos

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `GET /api/sales/:id` - Obtener venta
- `DELETE /api/sales/:id` - Cancelar venta

### Clientes
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `GET /api/customers/search` - Buscar clientes

## 🆘 Solución de Problemas

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar conexión
psql -h localhost -U app_user -d sistema_ventas
```

### Error de puerto en uso
```bash
# Verificar qué proceso está usando el puerto
lsof -i :3000

# Matar proceso si es necesario
kill -9 <PID>
```

### Error de CORS
- Verificar que `CORS_ORIGIN` en `.env` coincida con el dominio del frontend
- Asegurar que el frontend use la URL correcta del backend

### Error de autenticación
- Verificar que el token JWT esté siendo enviado correctamente
- Asegurar que el backend esté corriendo
- Verificar las credenciales de acceso

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. **Verificar logs** del backend
2. **Comprobar conexión** a base de datos
3. **Validar configuración** de variables de entorno
4. **Consultar documentación** del proyecto

## 🎯 Próximos Pasos

Después del despliegue exitoso:

1. **Personalizar** el sistema según tus necesidades
2. **Agregar** más productos y clientes
3. **Configurar** backups automáticos
4. **Implementar** monitoreo
5. **Optimizar** para alto tráfico
6. **Agregar** integraciones adicionales

## 📝 Notas Importantes

- **Backup**: Realizar backups regulares de la base de datos
- **Seguridad**: Cambiar todas las contraseñas por defecto
- **Actualizaciones**: Mantener dependencias actualizadas
- **Monitoreo**: Implementar monitoreo para producción
- **Documentación**: Mantener documentación actualizada

---

**¡El sistema está completamente funcional y listo para usar!**

Para cualquier problema o consulta, consulta la documentación completa en los archivos README.md del proyecto.