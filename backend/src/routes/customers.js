const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getTopCustomers
} = require('../controllers/customerController');

const router = express.Router();

// Validaciones
const customerValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage('El teléfono debe tener entre 5 y 20 caracteres'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La dirección no puede exceder 500 caracteres'),
  body('creditBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El crédito debe ser un número positivo')
];

// Rutas públicas (solo lectura)
router.get('/search', searchCustomers);

// Rutas protegidas
router.get('/', authenticate, getCustomers);
router.get('/top', authenticate, getTopCustomers);
router.get('/:id', authenticate, getCustomerById);

// Rutas que requieren rol de cajero o superior
router.post('/', authenticate, authorize('cashier', 'manager', 'admin'), customerValidation, createCustomer);
router.put('/:id', authenticate, authorize('cashier', 'manager', 'admin'), customerValidation, updateCustomer);

// Rutas que requieren rol de manager o admin
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteCustomer);

module.exports = router;