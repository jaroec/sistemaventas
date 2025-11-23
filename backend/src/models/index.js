const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const InventoryMovement = require('./InventoryMovement');
const Supplier = require('./Supplier');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
/**
 * Define TODAS las asociaciones entre modelos
 * ✅ TODOS los aliases son ÚNICOS
 * ✅ Sin conflictos
 */
const defineAssociations = () => {
  console.log('🔗 Definiendo asociaciones de modelos...');
  
  try {
    // ==========================================
    // USER ASSOCIATIONS
    // ==========================================
    // User crea ventas (como vendedor)
    User.hasMany(Sale, { 
      foreignKey: 'userId', 
      as: 'salesCreated',  // ✅ ÚNICO
      onDelete: 'SET NULL'
    });
    
    Sale.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'seller'  // ✅ ÚNICO
    });

    // User registra movimientos de inventario
    User.hasMany(InventoryMovement, { 
      foreignKey: 'userId', 
      as: 'inventoryMovementsCreated',  // ✅ ÚNICO
      onDelete: 'SET NULL'
    });
    
    InventoryMovement.belongsTo(User, { 
      foreignKey: 'userId', 
      as: 'recordedBy'  // ✅ ÚNICO
    });

    console.log('  ✅ User ↔ Sale (seller)');
    console.log('  ✅ User ↔ InventoryMovement (recordedBy)');

    // ==========================================
    // CUSTOMER ASSOCIATIONS
    // ==========================================
    // Customer realiza compras (es el comprador)
    Customer.hasMany(Sale, { 
      foreignKey: 'customerId', 
      as: 'purchaseHistory',  // ✅ ÚNICO
      onDelete: 'SET NULL'
    });
    
    Sale.belongsTo(Customer, { 
      foreignKey: 'customerId', 
      as: 'customer'  // ✅ ÚNICO
    });

    console.log('  ✅ Customer ↔ Sale (customer)');

    // ==========================================
    // CATEGORY ASSOCIATIONS
    // ==========================================
    // Category tiene muchos productos
    Category.hasMany(Product, { 
      foreignKey: 'categoryId', 
      as: 'categoryProducts',  // ✅ ÚNICO (diferente de "products")
      onDelete: 'SET NULL'
    });
    
    Product.belongsTo(Category, { 
      foreignKey: 'categoryId', 
      as: 'category'  // ✅ ÚNICO
    });

    console.log('  ✅ Category ↔ Product (categoryProducts)');

    // ==========================================
    // SUPPLIER ASSOCIATIONS
    // ==========================================
    // Supplier tiene muchos productos
    Supplier.hasMany(Product, { 
      foreignKey: 'supplierId', 
      as: 'suppliedProducts',  // ✅ ÚNICO (diferente de "categoryProducts")
      onDelete: 'SET NULL'
    });
    
    Product.belongsTo(Supplier, { 
      foreignKey: 'supplierId', 
      as: 'supplier'  // ✅ ÚNICO
    });

    console.log('  ✅ Supplier ↔ Product (suppliedProducts)');

    // ==========================================
    // SALE & SALEITEM ASSOCIATIONS
    // ==========================================
    // Sale tiene muchos items
    Sale.hasMany(SaleItem, { 
      foreignKey: 'saleId', 
      as: 'items',  // ✅ ÚNICO
      onDelete: 'CASCADE'
    });
    
    SaleItem.belongsTo(Sale, { 
      foreignKey: 'saleId', 
      as: 'sale'  // ✅ ÚNICO
    });

    console.log('  ✅ Sale ↔ SaleItem (items)');

    // ==========================================
    // PRODUCT & SALEITEM ASSOCIATIONS
    // ==========================================
    // Product tiene muchos items de venta
    Product.hasMany(SaleItem, { 
      foreignKey: 'productId', 
      as: 'saleLineItems',  // ✅ ÚNICO
      onDelete: 'CASCADE'
    });
    
    SaleItem.belongsTo(Product, { 
      foreignKey: 'productId', 
      as: 'soldProduct'  // ✅ ÚNICO (diferente de "product")
    });

    console.log('  ✅ Product ↔ SaleItem (soldProduct)');

    // ==========================================
    // PRODUCT & INVENTORY MOVEMENT ASSOCIATIONS
    // ==========================================
    // Product tiene muchos movimientos de inventario
    Product.hasMany(InventoryMovement, { 
      foreignKey: 'productId', 
      as: 'inventoryHistory',  // ✅ ÚNICO
      onDelete: 'CASCADE'
    });
    
    InventoryMovement.belongsTo(Product, { 
      foreignKey: 'productId', 
      as: 'movedProduct'  // ✅ ÚNICO (diferente de "soldProduct")
    });

    console.log('  ✅ Product ↔ InventoryMovement (movedProduct)');

    console.log('✅ Todas las asociaciones definidas correctamente\n');
    
  } catch (error) {
    console.error('❌ Error al definir asociaciones:', error.message);
    throw error;
  }
};

/**
 * Verificar que no haya asociaciones duplicadas
 */
const verifyAssociations = () => {
  console.log('🔍 Verificando unicidad de alias...\n');
  
  const allAssociations = {};
  let hasDuplicates = false;

  const models = [
    { model: User, name: 'User' },
    { model: Category, name: 'Category' },
    { model: Product, name: 'Product' },
    { model: Customer, name: 'Customer' },
    { model: Sale, name: 'Sale' },
    { model: SaleItem, name: 'SaleItem' },
    { model: InventoryMovement, name: 'InventoryMovement' },
    { model: Supplier, name: 'Supplier' }
  ];

  models.forEach(({ model, name }) => {
    if (model.associations) {
      Object.keys(model.associations).forEach(alias => {
        if (allAssociations[alias]) {
          console.log(`  ⚠️  DUPLICADO ENCONTRADO: "${alias}" en ${name} y ${allAssociations[alias]}`);
          hasDuplicates = true;
        } else {
          allAssociations[alias] = name;
        }
      });
    }
  });

  if (!hasDuplicates) {
    console.log('  ✅ Todos los alias son únicos\n');
  }
  
  return !hasDuplicates;
};

// Exportar
module.exports = {
  User,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  InventoryMovement,
  Supplier,
  defineAssociations,
  verifyAssociations
};
