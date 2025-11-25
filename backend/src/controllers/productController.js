const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const CostHistory = require('../models/CostHistory');
const { Op } = require('sequelize');

// Get all products with profit information
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ],
      order: [['name', 'ASC']]
    });

    // ✅ CORREGIR: Normalizar nombres de campos
    const productsWithProfit = products.map(product => {
      const p = product.toJSON();
      return {
        // Enviar con AMBOS nombres para compatibilidad
        id: p.id,
        name: p.name || p.nombre,
        nombre: p.name,
        description: p.description || p.descripcion,
        descripcion: p.description,
        barcode: p.barcode || p.codigoBarras,
        codigoBarras: p.barcode,
        categoryId: p.categoryId,
        category_id: p.categoryId,
        price: parseFloat(p.price || p.precio || 0),
        precio: parseFloat(p.price || p.precio || 0),
        costPrice: parseFloat(p.costPrice || p.cost_price || 0),
        cost_price: parseFloat(p.costPrice || p.cost_price || 0),
        stock: p.stock || p.currentStock || 0,
        currentStock: p.stock || p.currentStock || 0,
        minStock: p.minStock || p.min_stock || 10,
        min_stock: p.minStock || p.min_stock || 10,
        imageUrl: p.imageUrl || p.image_url,
        imagen: p.imageUrl || p.image_url,
        isActive: p.isActive !== false,
        status: p.status || 'active',
        category: p.category,
        supplier: p.supplier,
        // Calcular ganancias
        profitPerUnit: (p.price || 0) - (p.costPrice || 0),
        profitMarginPercentage: p.price > 0 
          ? (((p.price || 0) - (p.costPrice || 0)) / p.price) * 100 
          : 0,
        totalProfitValue: ((p.price || 0) - (p.costPrice || 0)) * (p.stock || 0)
      };
    });

    res.json({ 
      products: productsWithProfit,
      data: productsWithProfit // Enviar también como 'data' para compatibilidad
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
};

// Get product by ID with profit details
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productWithProfit = {
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    };

    res.json(productWithProfit);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
};

// Create new product with profit calculation
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      costPrice,
      profitMargin,
      manualSalePrice,
      currentStock,
      minimumStock,
      barcode,
      categoryId,
      supplierId,
      isUsingManualPrice
    } = req.body;

    // Validate required fields
    if (!name || costPrice === undefined || profitMargin === undefined) {
      return res.status(400).json({ 
        error: 'Name, cost price, and profit margin are required' 
      });
    }

    // Validate profit margin
    if (profitMargin < 0 || profitMargin >= 100) {
      return res.status(400).json({ 
        error: 'Profit margin must be between 0 and 99.99' 
      });
    }

    const product = await Product.create({
      name,
      description,
      costPrice: parseFloat(costPrice),
      profitMargin: parseFloat(profitMargin),
      manualSalePrice: manualSalePrice ? parseFloat(manualSalePrice) : null,
      currentStock: parseInt(currentStock) || 0,
      minimumStock: parseInt(minimumStock) || 10,
      barcode,
      categoryId,
      supplierId,
      isUsingManualPrice: isUsingManualPrice || false
    });

    const productWithProfit = {
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    };

    res.status(201).json(productWithProfit);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
};

// Update product with profit recalculation
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldCostPrice = product.costPrice;
    const oldSalePrice = product.getSalePrice();

    // Update product fields
    const updates = req.body;
    
    // Track cost price changes
    if (updates.costPrice && parseFloat(updates.costPrice) !== oldCostPrice) {
      await CostHistory.create({
        productId: product.id,
        oldCostPrice: oldCostPrice,
        newCostPrice: parseFloat(updates.costPrice),
        oldSalePrice: oldSalePrice,
        newSalePrice: product.getSalePrice(),
        changeReason: updates.changeReason || 'Cost price update',
        changedBy: req.user?.username || 'System'
      });
    }

    // Update product
    await product.update(updates);

    // Recalculate sale price if cost or margin changed
    if (updates.costPrice || updates.profitMargin) {
      await product.updateSalePrice();
    }

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    });

    const productWithProfit = {
      ...updatedProduct.toJSON(),
      salePrice: updatedProduct.getSalePrice(),
      profitPerUnit: updatedProduct.getProfitPerUnit(),
      profitMarginPercentage: updatedProduct.getProfitMarginPercentage(),
      totalProfitValue: updatedProduct.getTotalProfitValue()
    };

    res.json(productWithProfit);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
};

// Update product pricing
const updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { costPrice, profitMargin, manualSalePrice, isUsingManualPrice } = req.body;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldCostPrice = product.costPrice;
    const oldSalePrice = product.getSalePrice();

    // Update pricing fields
    if (costPrice !== undefined) product.costPrice = parseFloat(costPrice);
    if (profitMargin !== undefined) product.profitMargin = parseFloat(profitMargin);
    if (manualSalePrice !== undefined) product.manualSalePrice = parseFloat(manualSalePrice);
    if (isUsingManualPrice !== undefined) product.isUsingManualPrice = isUsingManualPrice;

    // Save changes
    await product.save();

    // Track cost history if cost changed
    if (costPrice && parseFloat(costPrice) !== oldCostPrice) {
      await CostHistory.create({
        productId: product.id,
        oldCostPrice: oldCostPrice,
        newCostPrice: parseFloat(costPrice),
        oldSalePrice: oldSalePrice,
        newSalePrice: product.getSalePrice(),
        changeReason: 'Pricing update',
        changedBy: req.user?.username || 'System'
      });
    }

    const productWithProfit = {
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    };

    res.json(productWithProfit);
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({ error: 'Error updating pricing' });
  }
};

// Set manual price for product
const setManualPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.setManualPrice(parseFloat(price));

    const productWithProfit = {
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    };

    res.json(productWithProfit);
  } catch (error) {
    console.error('Error setting manual price:', error);
    res.status(500).json({ error: 'Error setting manual price' });
  }
};

// Use calculated price for product
const useCalculatedPrice = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.useCalculatedPrice();

    const productWithProfit = {
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    };

    res.json(productWithProfit);
  } catch (error) {
    console.error('Error using calculated price:', error);
    res.status(500).json({ error: 'Error using calculated price' });
  }
};

// Get profit analysis
const getProfitAnalysis = async (req, res) => {
  try {
    const analysis = await Product.getProfitAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error getting profit analysis:', error);
    res.status(500).json({ error: 'Error getting profit analysis' });
  }
};

// Get cost history for a product
const getCostHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await CostHistory.findAll({
      where: { productId: id },
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['name'] }
      ]
    });

    res.json(history);
  } catch (error) {
    console.error('Error getting cost history:', error);
    res.status(500).json({ error: 'Error getting cost history' });
  }
};

// Bulk update profit margins
const bulkUpdateMargins = async (req, res) => {
  try {
    const { categoryId, marginIncrease, newMargin } = req.body;

    let whereClause = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const products = await Product.findAll({ where: whereClause });
    let updatedCount = 0;

    for (const product of products) {
      let newProfitMargin;
      
      if (newMargin !== undefined) {
        newProfitMargin = parseFloat(newMargin);
      } else if (marginIncrease !== undefined) {
        newProfitMargin = product.profitMargin + parseFloat(marginIncrease);
      } else {
        continue;
      }

      // Validate new margin
      if (newProfitMargin >= 0 && newProfitMargin < 100) {
        product.profitMargin = newProfitMargin;
        await product.save();
        await product.updateSalePrice();
        updatedCount++;
      }
    }

    res.json({ 
      message: `${updatedCount} products updated successfully`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error bulk updating margins:', error);
    res.status(500).json({ error: 'Error bulk updating margins' });
  }
};

// Search products with profit info
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { barcode: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ],
      limit: 20
    });

    const productsWithProfit = products.map(product => ({
      ...product.toJSON(),
      salePrice: product.getSalePrice(),
      profitPerUnit: product.getProfitPerUnit(),
      profitMarginPercentage: product.getProfitMarginPercentage(),
      totalProfitValue: product.getTotalProfitValue()
    }));

    res.json(productsWithProfit);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Error searching products' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updatePricing,
  setManualPrice,
  useCalculatedPrice,
  getProfitAnalysis,
  getCostHistory,
  bulkUpdateMargins,
  searchProducts
};
