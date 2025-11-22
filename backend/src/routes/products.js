const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  searchProducts,
  updateStock
} = require('../controllers/productController');

const router = express.Router();

// Validaciones
const createProductValidation = [
  body('name')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres')
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('barcode')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('El código de barras debe tener entre 5 y 50 caracteres'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo')
    .notEmpty()
    .withMessage('La categoría es requerida'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo')
    .notEmpty()
    .withMessage('El precio es requerido'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El costo debe ser un número positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock mínimo debe ser un número entero positivo'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
];

const updateProductValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('barcode')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('El código de barras debe tener entre 5 y 50 caracteres'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El costo debe ser un número positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock mínimo debe ser un número entero positivo'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
];

const updateStockValidation = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo')
    .notEmpty()
    .withMessage('La cantidad es requerida'),
  body('movementType')
    .optional()
    .isIn(['in', 'out', 'adjustment'])
    .withMessage('El tipo de movimiento debe ser: in, out, o adjustment'),
  body('reason')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La razón no puede exceder 100 caracteres')
];

// Rutas públicas (solo lectura)
router.get('/search', searchProducts);

// Rutas protegidas
router.get('/', authenticate, getProducts);
router.get('/low-stock', authenticate, getLowStockProducts);
router.get('/:id', authenticate, getProductById);

// Rutas que requieren rol de manager o admin
router.post('/', authenticate, authorize('manager', 'admin'), createProductValidation, createProduct);
router.put('/:id', authenticate, authorize('manager', 'admin'), updateProductValidation, updateProduct);
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteProduct);

// Rutas específicas para actualización de stock
router.put('/:id/stock', authenticate, authorize('manager', 'admin'), updateStockValidation, updateStock);

module.exports = router;