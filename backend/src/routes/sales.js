const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  cancelSale,
  getSalesSummary
} = require('../controllers/saleController');

const router = express.Router();

// Validaciones
const createSaleValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('La venta debe contener al menos un producto'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El descuento debe ser un número positivo'),
  body('taxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El impuesto debe ser un número positivo'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'transfer', 'credit'])
    .withMessage('El método de pago debe ser: cash, card, transfer o credit')
    .notEmpty()
    .withMessage('El método de pago es requerido'),
  body('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del cliente debe ser un número entero positivo'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

const updateSaleValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('El estado debe ser: pending, completed o cancelled'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

const cancelSaleValidation = [
  body('reason')
    .isLength({ min: 5, max: 200 })
    .withMessage('La razón debe tener entre 5 y 200 caracteres')
    .notEmpty()
    .withMessage('La razón de cancelación es requerida')
];

// Rutas protegidas
router.get('/', authenticate, getSales);
router.get('/summary', authenticate, getSalesSummary);
router.get('/:id', authenticate, getSaleById);

// Rutas que requieren rol de cajero o superior
router.post('/', authenticate, authorize('cashier', 'manager', 'admin'), createSaleValidation, createSale);
router.put('/:id', authenticate, authorize('cashier', 'manager', 'admin'), updateSaleValidation, updateSale);

// Rutas que requieren rol de manager o admin
router.delete('/:id', authenticate, authorize('manager', 'admin'), cancelSaleValidation, cancelSale);

module.exports = router;