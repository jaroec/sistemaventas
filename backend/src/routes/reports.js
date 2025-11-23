const express = require('express');
const router = express.Router();

// Aquí irán tus rutas de reportes
router.get('/', (req, res) => {
  res.json({ message: 'Rutas de reportes' });
});

module.exports = router;