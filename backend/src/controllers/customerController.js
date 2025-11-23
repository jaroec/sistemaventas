const { Customer } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Obtener todos los clientes
const getCustomers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      hasCredit = false,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtro de búsqueda
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro de crédito
    if (hasCredit === 'true') {
      whereClause.creditBalance = {
        [Op.gt]: 0
      };
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      customers,
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
};

// Obtener un cliente por ID
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con ID ${id}`
      });
    }

    res.json({ customer });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo cliente
const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { name, email, phone, address, creditBalance = 0 } = req.body;

    // Verificar si el email ya existe
    if (email) {
      const existingCustomer = await Customer.findOne({ 
        where: { email: email.toLowerCase().trim() } 
      });
      
      if (existingCustomer) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un cliente con este email'
        });
      }
    }

    // Verificar si el teléfono ya existe
    if (phone) {
      const existingCustomer = await Customer.findOne({ 
        where: { phone: phone.trim() } 
      });
      
      if (existingCustomer) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un cliente con este teléfono'
        });
      }
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      creditBalance
    });

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      customer
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un cliente
const updateCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, phone, address, creditBalance } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con ID ${id}`
      });
    }

    // Verificar email (excluyendo el cliente actual)
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCustomer) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un cliente con este email'
        });
      }
    }

    // Verificar teléfono (excluyendo el cliente actual)
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        where: {
          phone: phone.trim(),
          id: { [Op.ne]: id }
        }
      });
      
      if (existingCustomer) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un cliente con este teléfono'
        });
      }
    }

    await customer.update({
      name: name || customer.name,
      email: email !== undefined ? email : customer.email,
      phone: phone !== undefined ? phone : customer.phone,
      address: address !== undefined ? address : customer.address,
      creditBalance: creditBalance !== undefined ? creditBalance : customer.creditBalance
    });

    res.json({
      message: 'Cliente actualizado exitosamente',
      customer
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un cliente (soft delete)
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No se encontró un cliente con ID ${id}`
      });
    }

    // Verificar si el cliente tiene ventas
    const salesCount = await customer.countSales();
    if (salesCount > 0) {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'No se puede eliminar el cliente porque tiene ventas asociadas'
      });
    }

    // Soft delete
    await customer.update({ isActive: false });

    res.json({
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Buscar clientes
const searchCustomers = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Búsqueda requerida',
        message: 'Se requiere un término de búsqueda'
      });
    }

    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

// Obtener clientes principales (top customers)
const getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const customers = await Customer.getTopCustomers(parseInt(limit));
    
    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getTopCustomers
};
