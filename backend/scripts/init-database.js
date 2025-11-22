const { sequelize } = require('../src/config/database');
const { defineAssociations } = require('../src/models');

// Script para inicializar la base de datos
const initDatabase = async () => {
  try {
    console.log('🚀 Iniciando configuración de base de datos...');
    
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Definir asociaciones
    defineAssociations();
    console.log('✅ Asociaciones definidas');
    
    // Sincronizar modelos
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    // Cerrar conexión
    await sequelize.close();
    console.log('✅ Base de datos inicializada correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar script
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };