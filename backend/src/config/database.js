const { Sequelize } = require('sequelize');

// Configuración de la conexión a PostgreSQL
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'sistema_ventas',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jaroec31317570.',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Verificar conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    return false;
  }
};

// Cerrar conexión
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión a PostgreSQL cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  closeConnection
};
