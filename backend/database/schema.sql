-- Sistema de Ventas - Esquema PostgreSQL
-- Base de datos completa para sistema de punto de ventas

-- Crear base de datos (ejecutar manualmente)
-- CREATE DATABASE sistema_ventas;

-- Conectar a la base de datos sistema_ventas

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de usuarios/sistema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    barcode VARCHAR(50) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 5 CHECK (min_stock >= 0),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    credit_balance DECIMAL(10,2) DEFAULT 0 CHECK (credit_balance >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalles de venta (items)
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer')),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(100),
    reference_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar movimientos de inventario
CREATE OR REPLACE FUNCTION register_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id, user_id)
        VALUES (NEW.product_id, 'out', NEW.quantity, (SELECT stock FROM products WHERE id = NEW.product_id), 
                (SELECT stock FROM products WHERE id = NEW.product_id) - NEW.quantity, 'Venta', NEW.sale_id, 1);
        
        UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar movimientos de inventario al crear items de venta
CREATE TRIGGER register_sale_inventory_movement
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION register_inventory_movement();

-- Función para generar número de factura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month VARCHAR(6);
    sequential_number INTEGER;
    invoice_number VARCHAR(20);
BEGIN
    year_month = TO_CHAR(CURRENT_DATE, 'YYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 7) AS INTEGER)), 0) + 1
    INTO sequential_number
    FROM sales 
    WHERE SUBSTRING(invoice_number FROM 1 FOR 6) = year_month;
    
    invoice_number = year_month || LPAD(sequential_number::TEXT, 4, '0');
    NEW.invoice_number = invoice_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de factura
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Usuario administrador por defecto (contraseña: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES 
('admin', 'admin@sistema.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5xX9otG.yK', 'Administrador', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Categorías por defecto
INSERT INTO categories (name, description) VALUES 
('Electrónicos', 'Productos electrónicos y tecnología'),
('Alimentos', 'Productos alimenticios y bebidas'),
('Ropa', 'Ropa y accesorios'),
('Hogar', 'Productos para el hogar y decoración')
ON CONFLICT DO NOTHING;

-- Configuraciones por defecto
INSERT INTO settings (key_name, value, description) VALUES 
('company_name', 'Tienda Donde Todo Se Vende', 'Nombre de la empresa'),
('company_address', 'Calle Principal #123, Col. Centro', 'Dirección de la empresa'),
('company_phone', '555-0123', 'Teléfono de la empresa'),
('company_email', 'info@tienda.com', 'Email de la empresa'),
('default_tax_rate', '16', 'Tasa de impuesto por defecto (%)'),
('default_currency', 'MXN', 'Moneda por defecto'),
('loyalty_points_rate', '0.01', 'Tasa de conversión de puntos de fidelidad'),
('minimum_stock_alert', '10', 'Nivel mínimo de stock para alertas')
ON CONFLICT (key_name) DO NOTHING;

-- =====================================================
-- VISTAS PARA REPORTES
-- =====================================================

-- Vista de ventas diarias
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_ticket
FROM sales 
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vista de productos más vendidos
CREATE OR REPLACE VIEW top_products AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    c.name as category_name,
    SUM(si.quantity) as total_sold,
    SUM(si.subtotal) as total_revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.name, p.category_id, c.name
ORDER BY total_sold DESC;

-- Vista de stock bajo
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.*,
    c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.stock <= p.min_stock
AND p.is_active = true
ORDER BY p.stock ASC;

-- Vista de clientes con más compras
CREATE OR REPLACE VIEW top_customers AS
SELECT 
    c.*,
    COUNT(s.id) as total_purchases,
    SUM(s.total_amount) as total_spent,
    MAX(s.created_at) as last_purchase_date
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
WHERE s.status = 'completed'
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.loyalty_points, c.credit_balance, c.is_active, c.created_at, c.updated_at
ORDER BY total_spent DESC;

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Crear roles si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password_123';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_admin') THEN
        CREATE ROLE app_admin WITH LOGIN PASSWORD 'admin_password_123';
    END IF;
END
$$;

-- Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_admin;

-- Otorgar permisos a vistas
GRANT SELECT ON daily_sales TO app_user;
GRANT SELECT ON top_products TO app_user;
GRANT SELECT ON low_stock_products TO app_user;
GRANT SELECT ON top_customers TO app_user;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente' as status;
