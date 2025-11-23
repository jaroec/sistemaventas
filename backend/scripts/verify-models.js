/**
 * Script para verificar que NO haya asociaciones en los archivos de modelos
 * Ejecutar con: node scripts/verify-models.js
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/models');
const modelFiles = [
  'User.js',
  'Category.js',
  'Product.js',
  'Customer.js',
  'Sale.js',
  'SaleItem.js',
  'InventoryMovement.js',
  'Supplier.js'
];

console.log('\n🔍 VERIFICANDO ARCHIVOS DE MODELOS\n');
console.log('Buscando asociaciones que deberían estar CENTRALIZADAS...\n');

let totalIssues = 0;

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasAssociations = {
    hasMany: content.includes('.hasMany('),
    belongsTo: content.includes('.belongsTo('),
    belongsToMany: content.includes('.belongsToMany(')
  };

  const issues = Object.entries(hasAssociations)
    .filter(([_, has]) => has)
    .map(([method, _]) => method);

  if (issues.length > 0) {
    console.log(`❌ ${file}`);
    issues.forEach(issue => {
      console.log(`   ⚠️  Contiene: ${issue}()`);
      
      // Encontrar la línea
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(issue + '(')) {
          console.log(`      Línea ${index + 1}: ${line.trim().substring(0, 80)}`);
        }
      });
    });
    console.log();
    totalIssues += issues.length;
  } else {
    console.log(`✅ ${file}`);
  }
});

console.log('\n' + '='.repeat(60));
if (totalIssues === 0) {
  console.log('✅ TODOS LOS MODELOS ESTÁN LIMPIOS');
  console.log('   Sin asociaciones encontradas');
  console.log('   Todas deben estar en models/index.js');
} else {
  console.log(`❌ ENCONTRADOS ${totalIssues} PROBLEMAS`);
  console.log('   Necesitas limpiar esos archivos');
  console.log('\n📋 QUÉ HACER:');
  console.log('   1. Abre cada archivo con ❌');
  console.log('   2. Busca las líneas con .hasMany(), .belongsTo(), etc.');
  console.log('   3. ELIMINA esas líneas completamente');
  console.log('   4. Ejecuta este script nuevamente');
}
console.log('='.repeat(60) + '\n');
