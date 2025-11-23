const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { Product, Category } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// ============================================
// VALIDACIONES
// ============================================

const createProductValidation = [
  body('name')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres')
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo')
    .notEmpty()
    .withMessage('El precio es requerido'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de costo debe ser un número positivo'),
  body('profitMargin')
    .optional()
    .isFloat({ min: 0, max: 99.99 })
    .withMessage('El margen debe estar entre 0 y 99.99')
];

const updateProductValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de costo debe ser un número positivo'),
  body('profitMargin')
    .optional()
    .isFloat({ min: 0, max: 99.99 })
    .withMessage('El margen debe estar entre 0 y 99.99')
];

// ============================================
// RUTAS PÚBLICAS (Lectura)
// ============================================

/**
 * GET /api/products
 * Obtener todos los productos
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      search,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Obtener un producto por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: `No se encontró un producto con ID ${id}`
      });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/search
 * Buscar productos
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Búsqueda requerida',
        message: 'Se requiere un término de búsqueda'
      });
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { barcode: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// ============================================
// RUTAS PROTEGIDAS (Escritura)
// ============================================

/**
 * POST /api/products
 * Crear un nuevo producto
 */
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin'),
  createProductValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validación fallida',
          details: errors.array()
        });
      }

      const {
        name,
        description,
        price,
        costPrice = 0,
        profitMargin = 30,
        categoryId,
        supplierId,
        barcode,
        stock = 0,
        minStock = 5
      } = req.body;

      const product = await Product.create({
        name,
        description,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice),
        profitMargin: parseFloat(profitMargin),
        categoryId,
        supplierId,
        barcode,
        stock: parseInt(stock),
        minStock: parseInt(minStock)
      });

      const productWithCategory = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        message: 'Producto creado exitosamente',
        product: productWithCategory
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/products/:id
 * Actualizar un producto
 */
router.put(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  updateProductValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validación fallida',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const {
        name,
        description,
        price,
        costPrice,
        profitMargin,
        categoryId,
        barcode,
        stock,
        minStock
      } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: `No se encontró un producto con ID ${id}`
        });
      }

      await product.update({
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : product.costPrice,
        profitMargin: profitMargin !== undefined ? parseFloat(profitMargin) : product.profitMargin,
        categoryId: categoryId !== undefined ? categoryId : product.categoryId,
        barcode: barcode !== undefined ? barcode : product.barcode,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        minStock: minStock !== undefined ? parseInt(minStock) : product.minStock
      });

      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        message: 'Producto actualizado exitosamente',
        product: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/products/:id
 * Eliminar un producto
 */
router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: `No se encontró un producto con ID ${id}`
        });
      }

      await product.destroy();

      res.json({
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/products/low-stock
 * Obtener productos con stock bajo
 */
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        [Op.where]: sequelize.where(
          sequelize.col('stock'),
          Op.lte,
          sequelize.col('min_stock')
        )
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['stock', 'ASC']]
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
