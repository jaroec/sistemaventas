const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'category_id'
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'supplier_id'
  },
  // Precio de venta (normal)
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Precio de costo (para cálculo de ganancias)
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    },
    field: 'cost_price'
  },
  // Margen de ganancia deseado (%)
  profitMargin: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 30,
    validate: {
      min: 0,
      max: 99.99
    },
    field: 'profit_margin'
  },
  // Precio calculado automáticamente
  calculatedSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'calculated_sale_price'
  },
  // Precio manual (opcional, para sobrescribir el calculado)
  manualSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'manual_sale_price'
  },
  // Indica si usa precio manual
  isUsingManualPrice: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_using_manual_price'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: 0
    },
    field: 'min_stock'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
    defaultValue: 'active'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (product) => {
      // Calcular precio de venta automáticamente
      if (product.costPrice && product.profitMargin !== undefined && !product.isUsingManualPrice) {
        const margin = parseFloat(product.profitMargin);
        const cost = parseFloat(product.costPrice);
        
        if (margin >= 100) {
          product.calculatedSalePrice = cost * 2;
        } else if (margin >= 0) {
          product.calculatedSalePrice = parseFloat((cost / (1 - (margin / 100))).toFixed(2));
        }
      }
    }
  }
});

// ============================================
// MÉTODOS DE INSTANCIA (Cálculo de ganancias)
// ============================================

Product.prototype.getSalePrice = function() {
  if (this.isUsingManualPrice && this.manualSalePrice) {
    return parseFloat(this.manualSalePrice);
  }
  return parseFloat(this.calculatedSalePrice || this.price || 0);
};

Product.prototype.getProfitPerUnit = function() {
  const salePrice = this.getSalePrice();
  const costPrice = parseFloat(this.costPrice || 0);
  return salePrice - costPrice;
};

Product.prototype.getProfitMarginPercentage = function() {
  const salePrice = this.getSalePrice();
  const costPrice = parseFloat(this.costPrice || 0);
  
  if (salePrice <= 0 || costPrice <= 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
};

Product.prototype.getTotalProfitValue = function() {
  return this.getProfitPerUnit() * (this.stock || 0);
};

Product.prototype.updateSalePrice = async function() {
  if (!this.isUsingManualPrice && this.costPrice && this.profitMargin !== undefined) {
    const margin = parseFloat(this.profitMargin);
    const cost = parseFloat(this.costPrice);
    
    if (margin < 100) {
      this.calculatedSalePrice = parseFloat((cost / (1 - (margin / 100))).toFixed(2));
    } else {
      this.calculatedSalePrice = cost * 2;
    }
    
    await this.save();
  }
  return this.getSalePrice();
};

Product.prototype.setManualPrice = async function(price) {
  this.manualSalePrice = parseFloat(price);
  this.isUsingManualPrice = true;
  await this.save();
};

Product.prototype.useCalculatedPrice = async function() {
  this.isUsingManualPrice = false;
  this.manualSalePrice = null;
  await this.save();
};

// ============================================
// MÉTODOS DE CLASE (Análisis de rentabilidad)
// ============================================

Product.getProfitAnalysis = async function() {
  const products = await this.findAll({
    where: { status: 'active' }
  });

  if (products.length === 0) {
    return {
      totalProducts: 0,
      totalInventoryValue: 0,
      totalCostValue: 0,
      totalProfitValue: 0,
      averageMargin: 0,
      productsWithLowMargin: [],
      mostProfitableProducts: []
    };
  }

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
    
    const inventoryValue = salePrice * product.stock;
    const costValue = parseFloat(product.costPrice || 0) * product.stock;
    const profitValue = profitPerUnit * product.stock;

    analysis.totalInventoryValue += inventoryValue;
    analysis.totalCostValue += costValue;
    analysis.totalProfitValue += profitValue;
    totalMarginSum += marginPercentage;

    // Identificar productos con bajo margen
    if (marginPercentage < 20 && marginPercentage >= 0) {
      analysis.productsWithLowMargin.push({
        id: product.id,
        name: product.name,
        margin: marginPercentage,
        salePrice: salePrice,
        costPrice: product.costPrice,
        profitPerUnit: profitPerUnit
      });
    }

    // Rastrear productos más rentables
    analysis.mostProfitableProducts.push({
      id: product.id,
      name: product.name,
      profitPerUnit: profitPerUnit,
      totalProfitValue: profitValue,
      marginPercentage: marginPercentage,
      stock: product.stock
    });
  });

  analysis.averageMargin = products.length > 0 ? totalMarginSum / products.length : 0;
  
  // Ordenar productos más rentables
  analysis.mostProfitableProducts.sort((a, b) => b.totalProfitValue - a.totalProfitValue);
  analysis.mostProfitableProducts = analysis.mostProfitableProducts.slice(0, 10);

  // Ordenar por margen bajo
  analysis.productsWithLowMargin.sort((a, b) => a.margin - b.margin);

  return analysis;
};

// 🚫 NO HAY ASOCIACIONES AQUÍ
// Todas las asociaciones se definen CENTRALIZADAMENTE en models/index.js
// mediante la función defineAssociations()

module.exports = Product;
