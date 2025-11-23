/**
 * Script para diagnosticar conflictos de asociaciones
 * Ejecutar con: node scripts/debug-associations.js
 */

const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Sale = require('../src/models/Sale');
const SaleItem = require('../src/models/SaleItem');
const InventoryMovement = require('../src/models/InventoryMovement');
const Supplier = require('../src/models/Supplier');

async function debugAssociations() {
  try {
    console.log('🔍 DIAGNOSTICANDO ASOCIACIONES\n');
    
    // Listar todos los modelos
    console.log('📋 Modelos cargados:');
    console.log('✅ User');
    console.log('✅ Category');
    console.log('✅ Product');
    console.log('✅ Customer');
    console.log('✅ Sale');
    console.log('✅ SaleItem');
    console.log('✅ InventoryMovement');
    console.log('✅ Supplier\n');
    
    // Verificar asociaciones de User
    console.log('🔎 Asociaciones de User:');
    if (User.associations) {
      console.log('   Encontradas:', Object.keys(User.associations));
    } else {
      console.log('   ⚠️  Sin asociaciones aún');
    }
    
    console.log('\n🔎 Asociaciones de Sale:');
    if (Sale.associations) {
      console.log('   Encontradas:', Object.keys(Sale.associations));
    } else {
      console.log('   ⚠️  Sin asociaciones aún');
    }
    
    console.log('\n🔎 Asociaciones de Product:');
    if (Product.associations) {
      console.log('   Encontradas:', Object.keys(Product.associations));
    } else {
      console.log('   ⚠️  Sin asociaciones aún');
    }
    
    // Intentar definir asociaciones de manera segura
    console.log('\n🔗 Intentando definir asociaciones...\n');
    
    // Limpiar asociaciones previas si existen
    Object.keys(User.associations || {}).forEach(key => {
      delete User.associations[key];
    });
    Object.keys(Sale.associations || {}).forEach(key => {
      delete Sale.associations[key];
    });
    
    // Definir de una en una con verificación
    try {
      console.log('  1. User.hasMany(Sale)...');
      User.hasMany(Sale, { 
        foreignKey: 'userId', 
        as: 'userSales',  // ✅ Alias ÚNICO
        onDelete: 'SET NULL'
      });
      console.log('     ✅ OK\n');
    } catch (e) {
      console.log('     ❌ ERROR:', e.message, '\n');
    }
    
    try {
      console.log('  2. Customer.hasMany(Sale)...');
      Customer.hasMany(Sale, { 
        foreignKey: 'customerId', 
        as: 'customerSales',  // ✅ Alias ÚNICO
        onDelete: 'SET NULL'
      });
      console.log('     ✅ OK\n');
    } catch (e) {
      console.log('     ❌ ERROR:', e.message, '\n');
    }
    
    try {
      console.log('  3. Sale.belongsTo(User)...');
      Sale.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'seller'  // ✅ Alias ÚNICO
      });
      console.log('     ✅ OK\n');
    } catch (e) {
      console.log('     ❌ ERROR:', e.message, '\n');
    }
    
    try {
      console.log('  4. Sale.belongsTo(Customer)...');
      Sale.belongsTo(Customer, { 
        foreignKey: 'customerId', 
        as: 'buyer'  // ✅ Alias ÚNICO
      });
      console.log('     ✅ OK\n');
    } catch (e) {
      console.log('     ❌ ERROR:', e.message, '\n');
    }
    
    console.log('✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

debugAssociations();
