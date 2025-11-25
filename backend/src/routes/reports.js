const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Sale, SaleItem, Product, Category } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/reports/sales-summary
 * Obtener resumen de ventas por período
 */
router.get('/sales-summary', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = { status: 'completed' };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const sales = await Sale.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'averageTicket'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalDiscounts'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTaxes']
      ],
      raw: true
    });
    
    const salesByMethod = await Sale.findAll({
      where: whereClause,
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      group: ['paymentMethod'],
      raw: true
    });
    
    res.json({
      summary: sales[0] || {
        totalSales: 0,
        totalRevenue: 0,
        averageTicket: 0,
        totalDiscounts: 0,
        totalTaxes: 0
      },
      paymentMethods: salesByMethod || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/top-products
 * Obtener productos más vendidos
 */
router.get('/top-products', authenticate, async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateWhere = {};
    if (startDate && endDate) {
      dateWhere = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }
    
    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'salesCount']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: { status: 'completed', ...dateWhere },
          attributes: [],
          required: true
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'categoryId', 'price']
        }
      ],
      group: ['productId', 'product.id', 'product.name', 'product.categoryId', 'product.price'],
      order: [[sequelize.literal('totalQuantity'), 'DESC']],
      limit: parseInt(limit),
      subQuery: false,
      raw: true
    });
    
    res.json({ products: topProducts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/sales-by-category
 * Obtener ventas por categoría
 */
router.get('/sales-by-category', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateWhere = {};
    if (startDate && endDate) {
      dateWhere = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }
    
    const salesByCategory = await SaleItem.findAll({
      attributes: [
        [sequelize.col('product.category.name'), 'categoryName'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          where: { status: 'completed', ...dateWhere },
          attributes: [],
          required: true
        },
        {
          model: Product,
          as: 'product',
          attributes: [],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['name']
            }
          ]
        }
      ],
      group: ['product.category.id', 'product.category.name'],
      raw: true
    });
    
    res.json({ data: salesByCategory });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/daily-sales
 * Obtener ventas diarias
 */
router.get('/daily-sales', authenticate, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const dailySales = await Sale.findAll({
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgTicket']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
      raw: true
    });
    
    res.json({ data: dailySales });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/inventory-value
 * Obtener valor del inventario
 */
router.get('/inventory-value', authenticate, async (req, res, next) => {
  try {
    const inventoryValue = await Product.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('stock * price')), 'totalValue'],
        [sequelize.fn('SUM', sequelize.literal('stock * cost')), 'totalCost'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalItems']
      ],
      where: { isActive: true },
      raw: true
    });
    
    res.json({ data: inventoryValue[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/profit-analysis
 * Obtener análisis de ganancias
 */
router.get('/profit-analysis', authenticate, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { status: 'active' },
      attributes: [
        'id', 'name', 'price', 'costPrice', 'stock',
        [sequelize.literal('(price - COALESCE(cost_price, 0))'), 'profitPerUnit'],
        [sequelize.literal('stock * (price - COALESCE(cost_price, 0))'), 'totalProfit']
      ],
      raw: true
    });
    
    const analysis = {
      totalProducts: products.length,
      totalInventoryValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      totalCostValue: products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0),
      totalProfitValue: products.reduce((sum, p) => sum + (p.totalProfit || 0), 0),
      averageMargin: products.length > 0 
        ? products.reduce((sum, p) => sum + ((p.price > 0 ? ((p.price - (p.costPrice || 0)) / p.price) * 100 : 0)), 0) / products.length
        : 0
    };
    
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
