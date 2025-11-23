
// backend/src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const specs = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sistema de Ventas API',
            version: '1.0.0'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Development' }
        ]
    },
    apis: ['./src/routes/*.js']
});

module.exports = { swaggerUi, specs };

// En server.js:
const { swaggerUi, specs } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
