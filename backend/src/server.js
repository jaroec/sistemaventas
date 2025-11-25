const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { defineAssociations, verifyAssociations } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const responseFormatter = require('./middleware/responseFormatter');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const saleRoutes = require('./routes/sales');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// PASO 1: MIDDLEWARES GLOBALES (ANTES DE LAS RUTAS)
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================
// PASO 2: RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================================
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Ventas API',
    version: require('../package.json').version,
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      sales: '/api/sales',
      categories: '/api/categories',
      reports: '/api/reports',
      users: '/api/users'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version
  });
});

// ============================================================
// PASO 3: MIDDLEWARES DE API (RATE LIMITING + FORMATTER)
// ============================================================
app.use('/api/', limiter);
app.use('/api/', responseFormatter);

// ============================================================
// PASO 4: RUTAS DE API
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// ============================================================
// PASO 5: MIDDLEWARES DE ERROR (AL FINAL)
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// INICIAR SERVIDOR
// ============================================================
async function initializeDatabase() {
  try {
    console.log('🔗 Definiendo asociaciones de modelos...');
    defineAssociations();
    
    console.log('🔍 Verificando asociaciones...');
    const isValid = verifyAssociations();
    if (!isValid) {
      throw new Error('Hay asociaciones duplicadas o inválidas');
    }
    
    console.log('✅ Asociaciones configuradas correctamente\n');
  } catch (error) {
    console.error('❌ Error al configurar asociaciones:', error.message);
    throw error;
  }
}

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente\n');
    
    // Inicializar asociaciones
    await initializeDatabase();
    
    // Sincronizar modelos
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Sincronizando modelos con la base de datos...');
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos\n');
    } else {
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos verificados\n');
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📡 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log('📋 API endpoints disponibles:');
      console.log('   - Auth: /api/auth');
      console.log('   - Products: /api/products');
      console.log('   - Customers: /api/customers');
      console.log('   - Sales: /api/sales');
      console.log('   - Categories: /api/categories');
      console.log('   - Reports: /api/reports');
      console.log('   - Users: /api/users');
      console.log('   - Health: /health\n');
    });
    
    // Manejo de señales para cierre graceful
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        sequelize.close();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT recibido, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado');
        sequelize.close();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
