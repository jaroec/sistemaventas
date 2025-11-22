const { sequelize } = require('../src/config/database');
const { defineAssociations, User, Category, Product, Customer } = require('../src/models');
const bcrypt = require('bcryptjs');

// Datos de semilla
const seedData = {
  users: [
    {
      username: 'admin',
      email: 'admin@sistema.com',
      passwordHash: 'admin123',
      fullName: 'Administrador Principal',
      role: 'admin'
    },
    {
      username: 'manager',
      email: 'manager@sistema.com',
      passwordHash: 'manager123',
      fullName: 'Gerente de Tienda',
      role: 'manager'
    },
    {
      username: 'cajero1',
      email: 'cajero1@sistema.com',
      passwordHash: 'cajero123',
      fullName: 'Cajero Uno',
      role: 'cashier'
    }
  ],
  categories: [
    { name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
    { name: 'Alimentos', description: 'Productos alimenticios y bebidas' },
    { name: 'Ropa', description: 'Ropa y accesorios' },
    { name: 'Hogar', description: 'Productos para el hogar y decoración' }
  ],
  products: [
    // Electrónicos
    {
      name: 'Laptop Gamer Pro',
      description: 'Laptop de alto rendimiento para gaming y trabajo profesional',
      barcode: '1234567890123',
      categoryName: 'Electrónicos',
      price: 1299.99,
      cost: 950.00,
      stock: 15,
      minStock: 3
    },
    {
      name: 'Smartphone X12',
      description: 'Teléfono inteligente de última generación con cámara de alta resolución',
      barcode: '1234567890124',
      categoryName: 'Electrónicos',
      price: 699.99,
      cost: 520.00,
      stock: 25,
      minStock: 5
    },
    {
      name: 'Auriculares Bluetooth',
      description: 'Auriculares inalámbricos con noise canceling y batería de larga duración',
      barcode: '1234567890125',
      categoryName: 'Electrónicos',
      price: 89.99,
      cost: 65.00,
      stock: 35,
      minStock: 8
    },
    // Alimentos
    {
      name: 'Manzanas Orgánicas',
      description: 'Manzanas frescas de cultivo orgánico, libres de pesticidas',
      barcode: '1234567890126',
      categoryName: 'Alimentos',
      price: 3.99,
      cost: 2.50,
      stock: 150,
      minStock: 20
    },
    {
      name: 'Pasta Dental Premium',
      description: 'Pasta dental blanqueadora y protectora con sabor menta',
      barcode: '1234567890127',
      categoryName: 'Alimentos',
      price: 4.99,
      cost: 3.20,
      stock: 80,
      minStock: 15
    },
    // Ropa
    {
      name: 'Camisa Premium',
      description: 'Camisa de algodón de alta calidad, cómoda y elegante',
      barcode: '1234567890128',
      categoryName: 'Ropa',
      price: 49.99,
      cost: 35.00,
      stock: 40,
      minStock: 10
    },
    {
      name: 'Jeans Clásicos',
      description: 'Jeans de mezclilla duradera y cómoda, corte clásico',
      barcode: '1234567890129',
      categoryName: 'Ropa',
      price: 79.99,
      cost: 55.00,
      stock: 30,
      minStock: 8
    },
    // Hogar
    {
      name: 'Silla Oficina Ergonómica',
      description: 'Silla ergonómica para oficina profesional con soporte lumbar',
      barcode: '1234567890130',
      categoryName: 'Hogar',
      price: 299.99,
      cost: 220.00,
      stock: 12,
      minStock: 3
    }
  ],
  customers: [
    {
      name: 'Juan Pérez',
      email: 'juan@email.com',
      phone: '555-0123',
      address: 'Calle Principal 123, Col. Centro',
      loyaltyPoints: 150,
      creditBalance: 0
    },
    {
      name: 'María García',
      email: 'maria@email.com',
      phone: '555-0124',
      address: 'Avenida Central 456, Col. Norte',
      loyaltyPoints: 280,
      creditBalance: 100
    },
    {
      name: 'Carlos Rodríguez',
      email: 'carlos@email.com',
      phone: '555-0125',
      address: 'Plaza Mayor 789, Col. Sur',
      loyaltyPoints: 75,
      creditBalance: 0
    },
    {
      name: 'Ana López',
      email: 'ana@email.com',
      phone: '555-0126',
      address: 'Calle Secundaria 321, Col. Este',
      loyaltyPoints: 420,
      creditBalance: 50
    },
    {
      name: 'Luis Martínez',
      email: 'luis@email.com',
      phone: '555-0127',
      address: 'Boulevard Principal 654, Col. Oeste',
      loyaltyPoints: 95,
      creditBalance: 25
    }
  ]
};

// Script para poblar la base de datos
const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed de datos...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');
    
    // Definir asociaciones
    defineAssociations();
    console.log('✅ Asociaciones definidas');
    
    // Sincronizar modelos
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Modelos sincronizados');
    
    // Crear usuarios
    console.log('👤 Creando usuarios...');
    for (const userData of seedData.users) {
      const [user, created] = await User.findOrCreate({
        where: { username: userData.username },
        defaults: {
          ...userData,
          passwordHash: await bcrypt.hash(userData.passwordHash, 12)
        }
      });
      
      if (created) {
        console.log(`✅ Usuario creado: ${user.username}`);
      } else {
        console.log(`ℹ️  Usuario ya existe: ${user.username}`);
      }
    }
    
    // Crear categorías
    console.log('📂 Creando categorías...');
    const createdCategories = {};
    for (const categoryData of seedData.categories) {
      const [category, created] = await Category.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData
      });
      
      createdCategories[category.name] = category;
      
      if (created) {
        console.log(`✅ Categoría creada: ${category.name}`);
      } else {
        console.log(`ℹ️  Categoría ya existe: ${category.name}`);
      }
    }
    
    // Crear productos
    console.log('📦 Creando productos...');
    for (const productData of seedData.products) {
      const category = createdCategories[productData.categoryName];
      if (!category) {
        console.log(`❌ Categoría no encontrada: ${productData.categoryName}`);
        continue;
      }
      
      const [product, created] = await Product.findOrCreate({
        where: { barcode: productData.barcode },
        defaults: {
          ...productData,
          categoryId: category.id
        }
      });
      
      if (created) {
        console.log(`✅ Producto creado: ${product.name}`);
      } else {
        console.log(`ℹ️  Producto ya existe: ${product.name}`);
      }
    }
    
    // Crear clientes
    console.log('👥 Creando clientes...');
    for (const customerData of seedData.customers) {
      const [customer, created] = await Customer.findOrCreate({
        where: { email: customerData.email },
        defaults: customerData
      });
      
      if (created) {
        console.log(`✅ Cliente creado: ${customer.name}`);
      } else {
        console.log(`ℹ️  Cliente ya existe: ${customer.name}`);
      }
    }
    
    console.log('✅ Seed completado exitosamente');
    console.log('📊 Datos creados:');
    console.log(`  - ${seedData.users.length} usuarios`);
    console.log(`  - ${seedData.categories.length} categorías`);
    console.log(`  - ${seedData.products.length} productos`);
    console.log(`  - ${seedData.customers.length} clientes`);
    
    // Credenciales de acceso
    console.log('\n🔑 Credenciales de prueba:');
    console.log('Admin: admin@sistema.com / admin123');
    console.log('Manager: manager@sistema.com / manager123');
    console.log('Cajero: cajero1@sistema.com / cajero123');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

// Ejecutar script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
