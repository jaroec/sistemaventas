const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Endpoint de usuarios' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Crear usuario' });
});

module.exports = router;