// backend/src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Ventas API',
      version: '1.0.0',
      description: 'API completa para sistema de punto de ventas con PostgreSQL',
      contact: {
        name: 'Sistema Ventas Team',
        email: 'soporte@sistemaventas.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.sistemaventas.com',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        // Esquema de Usuario
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', format: 'email', example: 'admin@sistema.com' },
            fullName: { type: 'string', example: 'Administrador Principal' },
            role: { type: 'string', enum: ['admin', 'manager', 'cashier'], example: 'admin' },
            isActive: { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Esquema de Producto
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Laptop Gamer Pro' },
            description: { type: 'string', example: 'Laptop de alto rendimiento' },
            barcode: { type: 'string', example: '1234567890123' },
            categoryId: { type: 'integer', example: 1 },
            price: { type: 'number', format: 'float', example: 1299.99 },
            costPrice: { type: 'number', format: 'float', example: 950.00 },
            stock: { type: 'integer', example: 15 },
            minStock: { type: 'integer', example: 3 },
            imageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Esquema de Cliente
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@email.com' },
            phone: { type: 'string', example: '555-0123' },
            address: { type: 'string', example: 'Calle Principal 123' },
            loyaltyPoints: { type: 'integer', example: 150 },
            creditBalance: { type: 'number', format: 'float', example: 0 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Esquema de Venta
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            invoiceNumber: { type: 'string', example: '24110001' },
            customerId: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            totalAmount: { type: 'number', format: 'float', example: 1299.99 },
            discountAmount: { type: 'number', format: 'float', example: 0 },
            taxAmount: { type: 'number', format: 'float', example: 0 },
            paymentMethod: { type: 'string', enum: ['cash', 'card', 'transfer', 'credit'], example: 'cash' },
            status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], example: 'completed' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Esquema de Error
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Archivos donde están documentados los endpoints
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
