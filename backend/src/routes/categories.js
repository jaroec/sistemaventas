const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Validaciones
const categoryValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
];

// Rutas públicas (solo lectura)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Rutas protegidas que requieren rol de manager o admin
router.post('/', authenticate, authorize('manager', 'admin'), categoryValidation, createCategory);
router.put('/:id', authenticate, authorize('manager', 'admin'), categoryValidation, updateCategory);
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteCategory);

module.exports = router;
