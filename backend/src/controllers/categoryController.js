const { Category } = require('../models');
const { validationResult } = require('express-validator');

// Obtener todas las categorías
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// Obtener una categoría por ID
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada',
        message: `No se encontró una categoría con ID ${id}`
      });
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva categoría
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { name, description } = req.body;

    // Verificar si la categoría ya existe
    const existingCategory = await Category.findOne({ 
      where: { name: name.trim() } 
    });
    
    if (existingCategory) {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'Ya existe una categoría con este nombre'
      });
    }

    const category = await Category.create({
      name,
      description
    });

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una categoría
const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada',
        message: `No se encontró una categoría con ID ${id}`
      });
    }

    // Verificar si el nombre ya existe (excluyendo la categoría actual)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name: name.trim(),
          id: { [Category.sequelize.Op.ne]: id }
        }
      });
      
      if (existingCategory) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe una categoría con este nombre'
        });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description
    });

    res.json({
      message: 'Categoría actualizada exitosamente',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una categoría (soft delete)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada',
        message: `No se encontró una categoría con ID ${id}`
      });
    }

    // Verificar si la categoría tiene productos
    const productsCount = await category.countProducts();
    if (productsCount > 0) {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    // Soft delete
    await category.update({ isActive: false });

    res.json({
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
