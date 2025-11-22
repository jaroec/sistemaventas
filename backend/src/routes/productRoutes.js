const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Public routes (for now, can be protected later)
router.get('/search', productController.searchProducts);

// Protected routes
router.get('/', productController.getAllProducts);
router.get('/profit-analysis', productController.getProfitAnalysis);
router.get('/:id', productController.getProductById);
router.get('/:id/cost-history', productController.getCostHistory);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Pricing specific routes
router.put('/:id/pricing', productController.updatePricing);
router.post('/:id/manual-price', productController.setManualPrice);
router.post('/:id/calculated-price', productController.useCalculatedPrice);

// Bulk operations
router.post('/bulk-update-margins', productController.bulkUpdateMargins);

module.exports = router;