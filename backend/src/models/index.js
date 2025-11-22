const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const InventoryMovement = require('./InventoryMovement');

// Definir todas las asociaciones
const defineAssociations = () => {
  // User associations
  User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
  User.hasMany(InventoryMovement, { foreignKey: 'userId', as: 'inventoryMovements' });

  // Category associations
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

  // Product associations
  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
  Product.hasMany(InventoryMovement, { foreignKey: 'productId', as: 'inventoryMovements' });

  // Customer associations
  Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });

  // Sale associations
  Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
  Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });

  // SaleItem associations
  SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
  SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

  // InventoryMovement associations
  InventoryMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  InventoryMovement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

// Exportar todos los modelos
module.exports = {
  User,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  InventoryMovement,
  defineAssociations
};