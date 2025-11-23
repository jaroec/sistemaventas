const { sequelize } = require('../src/config/database');
const { defineAssociations, verifyAssociations } = require('../src/models');

/**
 * Script para inicializar la base de datos
 * 1. Verificar conexión
 * 2. Definir asociaciones
 * 3. Sincronizar modelos
 * 4. Verificar integridad
 */
const initDatabase = async () => {
  try {
    console.log('\n🚀 Iniciando configuración de base de datos...\n');
    
    // ============================================
    // PASO 1: Probar conexión
    // ============================================
    console.log('📡 Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida\n');
    
    // ============================================
    // PASO 2: Definir asociaciones
    // ============================================
    console.log('🔗 Configurando asociaciones de modelos...');
    defineAssociations();
    
    // ============================================
    // PASO 3: Verificar asociaciones
    // ============================================
    const isValid = verifyAssociations();
    if (!isValid) {
      throw new Error('Hay asociaciones duplicadas o inválidas');
    }
    console.log('\n');
    
    // ============================================
    // PASO 4: Sincronizar modelos con BD
    // ============================================
    console.log('🔄 Sincronizando modelos con la base de datos...');
    console.log('   (Modo: alter - modificará tablas existentes si es necesario)\n');
    
    await sequelize.sync({ 
      alter: false,  // ⚠️ Cambiar a true solo si sabes qué haces
      logging: (sql) => console.log(`   📝 SQL: ${sql}`)
    });
    
    console.log('\n✅ Modelos sincronizados con la base de datos\n');
    
    // ============================================
    // PASO 5: Verificación final
    // ============================================
    console.log('🔍 Realizando verificaciones finales...');
    
    // Contar tablas
    const tables = await sequelize.showAllSchemas({
      logging: false
    });
    
    // Obtener metadatos
    const queryInterface = sequelize.getQueryInterface();
    const dbTables = await queryInterface.showAllTables();
    console.log(`   ✅ Tablas en BD: ${dbTables.length}`);
    
    console.log('\n✅ Base de datos inicializada correctamente\n');
    
    console.log('📊 Estado de inicialización:');
    console.log('   ✅ Conexión establecida');
    console.log('   ✅ Asociaciones definidas');
    console.log('   ✅ Modelos sincronizados');
    console.log('   ✅ BD operacional\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error al inicializar la base de datos:');
    console.error(`   ${error.name}: ${error.message}\n`);
    
    if (error.message.includes('Duplicate')) {
      console.error('💡 SOLUCIÓN: Hay asociaciones duplicadas.');
      console.error('   Ejecuta: node scripts/debug-associations.js\n');
    }
    
    if (error.message.includes('connect')) {
      console.error('💡 SOLUCIÓN: PostgreSQL no está corriendo.');
      console.error('   En Windows:    services.msc (busca PostgreSQL)');
      console.error('   En Linux:      sudo systemctl start postgresql');
      console.error('   En macOS:      brew services start postgresql\n');
    }
    
    console.error(error.stack);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
