const { Sale, SaleItem, Product, Customer, User, InventoryMovement } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Obtener todas las ventas
const getSales = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      customerId, 
      userId,
      startDate, 
      endDate,
      paymentMethod,
      status = 'completed',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtros
    if (customerId) whereClause.customerId = customerId;
    if (userId) whereClause.userId = userId;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;
    if (status) whereClause.status = status;

    // Filtro por fecha
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: sales } = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'barcode']
          }]
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      sales,
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

// Obtener una venta por ID
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone', 'loyaltyPoints']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'barcode', 'price']
          }]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No se encontró una venta con ID ${id}`
      });
    }

    res.json({ sale });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva venta
const createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { 
      customerId, 
      items, 
      discountAmount = 0, 
      taxAmount = 0, 
      paymentMethod, 
      notes 
    } = req.body;

    // Validar que hay items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Items requeridos',
        message: 'La venta debe contener al menos un producto'
      });
    }

    // Verificar cliente si se especifica
    let customer = null;
    if (customerId) {
      customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({
          error: 'Cliente no encontrado',
          message: `No se encontró un cliente con ID ${customerId}`
        });
      }
    }

    // Verificar productos y calcular totales
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      // Validar cantidad
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: 'Cantidad inválida',
          message: `Cantidad inválida para el producto ${productId}`
        });
      }

      // Buscar producto
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: `No se encontró un producto con ID ${productId}`
        });
      }

      // Verificar stock
      if (product.stock < quantity) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          message: `Stock insuficiente para el producto ${product.name}. Stock disponible: ${product.stock}`
        });
      }

      // Calcular subtotal para este item
      const itemSubtotal = product.price * quantity;
      subtotal += itemSubtotal;

      // Agregar item a la lista
      saleItems.push({
        productId,
        quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        product // Guardar referencia temporal para el procesamiento
      });
    }

    // Calcular total
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Crear la venta
    const sale = await Sale.create({
      customerId,
      userId: req.user.id,
      totalAmount,
      discountAmount,
      taxAmount,
      paymentMethod,
      notes,
      status: 'completed'
    });

    // Crear items de venta y actualizar stock
    for (const item of saleItems) {
      // Crear item de venta
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      });

      // Actualizar stock del producto
      const newStock = item.product.stock - item.quantity;
      await item.product.update({ stock: newStock });

      // Registrar movimiento de inventario
      await InventoryMovement.create({
        productId: item.productId,
        movementType: 'out',
        quantity: item.quantity,
        previousStock: item.product.stock,
        newStock: newStock,
        reason: `Venta #${sale.invoiceNumber}`,
        userId: req.user.id,
        referenceId: sale.id
      });
    }

    // Actualizar puntos de fidelidad si hay cliente
    if (customer) {
      const loyaltyPointsRate = parseFloat(process.env.LOYALTY_POINTS_RATE) || 0.01;
      const earnedPoints = Math.floor(totalAmount * loyaltyPointsRate);
      
      if (earnedPoints > 0) {
        await customer.addLoyaltyPoints(earnedPoints);
      }
    }

    // Obtener la venta completa
    const saleWithDetails = await Sale.findByPk(sale.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'loyaltyPoints']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'barcode', 'price']
          }]
        }
      ]
    });

    res.status(201).json({
      message: 'Venta creada exitosamente',
      sale: saleWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una venta (solo ciertos campos)
const updateSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No se encontró una venta con ID ${id}`
      });
    }

    // Solo permitir cambiar estado y notas
    await sale.update({
      status: status || sale.status,
      notes: notes !== undefined ? notes : sale.notes
    });

    // Obtener la venta actualizada
    const updatedSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        }
      ]
    });

    res.json({
      message: 'Venta actualizada exitosamente',
      sale: updatedSale
    });
  } catch (error) {
    next(error);
  }
};

// Cancelar una venta
const cancelSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const sale = await Sale.findByPk(id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No se encontró una venta con ID ${id}`
      });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({
        error: 'Venta ya cancelada',
        message: 'Esta venta ya está cancelada'
      });
    }

    // Devolver stock de los productos
    for (const item of sale.items) {
      const newStock = item.product.stock + item.quantity;
      await item.product.update({ stock: newStock });

      // Registrar movimiento de inventario
      await InventoryMovement.create({
        productId: item.productId,
        movementType: 'in',
        quantity: item.quantity,
        previousStock: item.product.stock,
        newStock: newStock,
        reason: `Cancelación de venta #${sale.invoiceNumber}: ${reason}`,
        userId: req.user.id,
        referenceId: sale.id
      });
    }

    // Actualizar estado de la venta
    await sale.update({ 
      status: 'cancelled',
      notes: `${sale.notes || ''} [CANCELADA: ${reason}]`.trim()
    });

    res.json({
      message: 'Venta cancelada exitosamente',
      sale: {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        status: sale.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener resumen de ventas
const getSalesSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const summary = await Sale.findAll({
      where: {
        ...dateFilter,
        status: 'completed'
      },
      attributes: [
        [Op.fn('COUNT', Op.col('id')), 'totalSales'],
        [Op.fn('SUM', Op.col('total_amount')), 'totalRevenue'],
        [Op.fn('AVG', Op.col('total_amount')), 'averageTicket'],
        [Op.fn('SUM', Op.col('discount_amount')), 'totalDiscounts'],
        [Op.fn('SUM', Op.col('tax_amount')), 'totalTaxes']
      ],
      raw: true
    });

    // Obtener ventas por método de pago
    const salesByPaymentMethod = await Sale.findAll({
      where: {
        ...dateFilter,
        status: 'completed'
      },
      attributes: [
        'paymentMethod',
        [Op.fn('COUNT', Op.col('id')), 'count'],
        [Op.fn('SUM', Op.col('total_amount')), 'total']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      summary: summary[0] || {
        totalSales: 0,
        totalRevenue: 0,
        averageTicket: 0,
        totalDiscounts: 0,
        totalTaxes: 0
      },
      salesByPaymentMethod
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  cancelSale,
  getSalesSummary
};