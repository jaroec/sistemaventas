const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Category = require('./Category');
const Supplier = require('./Supplier');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'cost_price'
  },
  profitMargin: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 30.00,
    field: 'profit_margin',
    validate: {
      min: 0,
      max: 99.99
    }
  },
  calculatedSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'calculated_sale_price'
  },
  manualSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'manual_sale_price'
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'current_stock'
  },
  minimumStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    field: 'minimum_stock'
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
    defaultValue: 'active'
  },
  isUsingManualPrice: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_using_manual_price'
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (product) => {
      // Calculate sale price using the formula: PV = PC / (1 - % de ganancias)
      if (product.costPrice && product.profitMargin !== undefined) {
        const margin = parseFloat(product.profitMargin);
        const cost = parseFloat(product.costPrice);
        
        if (margin >= 100) {
          product.calculatedSalePrice = cost * 2; // Safety fallback
        } else if (margin >= 0) {
          product.calculatedSalePrice = parseFloat((cost / (1 - (margin / 100))).toFixed(2));
        }
      }
    }
  }
});

// Instance methods for profit calculation
Product.prototype.getSalePrice = function() {
  return this.isUsingManualPrice && this.manualSalePrice 
    ? parseFloat(this.manualSalePrice) 
    : parseFloat(this.calculatedSalePrice);
};

Product.prototype.getProfitPerUnit = function() {
  const salePrice = this.getSalePrice();
  const costPrice = parseFloat(this.costPrice);
  return salePrice - costPrice;
};

Product.prototype.getProfitMarginPercentage = function() {
  const salePrice = this.getSalePrice();
  const costPrice = parseFloat(this.costPrice);
  
  if (costPrice === 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
};

Product.prototype.getTotalProfitValue = function() {
  return this.getProfitPerUnit() * this.currentStock;
};

Product.prototype.updateSalePrice = async function() {
  // Recalculate sale price based on current cost and margin
  this.calculatedSalePrice = parseFloat((this.costPrice / (1 - (this.profitMargin / 100))).toFixed(2));
  await this.save();
  return this.calculatedSalePrice;
};

Product.prototype.setManualPrice = async function(price) {
  this.manualSalePrice = price;
  this.isUsingManualPrice = true;
  await this.save();
};

Product.prototype.useCalculatedPrice = async function() {
  this.isUsingManualPrice = false;
  this.manualSalePrice = null;
  await this.save();
};

// Class methods for profit analysis
Product.calculateOptimalMargin = function(costPrice, desiredSalePrice) {
  if (costPrice <= 0 || desiredSalePrice <= 0) return 0;
  
  const margin = ((desiredSalePrice - costPrice) / desiredSalePrice) * 100;
  return Math.max(0, Math.min(99.99, margin));
};

Product.getProfitAnalysis = async function() {
  const products = await Product.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'costPrice', 'calculatedSalePrice', 'manualSalePrice', 
                'profitMargin', 'currentStock', 'isUsingManualPrice']
  });

  const analysis = {
    totalProducts: products.length,
    totalInventoryValue: 0,
    totalCostValue: 0,
    totalProfitValue: 0,
    averageMargin: 0,
    productsWithLowMargin: [],
    mostProfitableProducts: []
  };

  let totalMarginSum = 0;

  products.forEach(product => {
    const salePrice = product.getSalePrice();
    const profitPerUnit = product.getProfitPerUnit();
    const marginPercentage = product.getProfitMarginPercentage();
    
    const inventoryValue = salePrice * product.currentStock;
    const costValue = product.costPrice * product.currentStock;
    const profitValue = profitPerUnit * product.currentStock;

    analysis.totalInventoryValue += inventoryValue;
    analysis.totalCostValue += costValue;
    analysis.totalProfitValue += profitValue;
    totalMarginSum += marginPercentage;

    // Identify products with low margins (< 20%)
    if (marginPercentage < 20) {
      analysis.productsWithLowMargin.push({
        id: product.id,
        name: product.name,
        margin: marginPercentage,
        salePrice: salePrice,
        costPrice: product.costPrice
      });
    }

    // Track most profitable products
    analysis.mostProfitableProducts.push({
      id: product.id,
      name: product.name,
      profitPerUnit: profitPerUnit,
      totalProfitValue: profitValue,
      marginPercentage: marginPercentage
    });
  });

  analysis.averageMargin = totalMarginSum / products.length;
  
  // Sort most profitable products
  analysis.mostProfitableProducts.sort((a, b) => b.totalProfitValue - a.totalProfitValue);
  analysis.mostProfitableProducts = analysis.mostProfitableProducts.slice(0, 10);

  // Sort low margin products by margin (ascending)
  analysis.productsWithLowMargin.sort((a, b) => a.margin - b.margin);

  return analysis;
};

// Associations
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

module.exports = Product;