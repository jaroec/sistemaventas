-- Sistema de Ventas - Esquema Mejorado con Sistema de Ganancias
-- Base de datos completa con cálculo automático de precios y márgenes de ganancia

-- Crear base de datos (ejecutar manualmente)
-- CREATE DATABASE sistema_ventas;

-- Conectar a la base de datos sistema_ventas

-- =====================================================
-- TABLAS EXISTENTES (MODIFICADAS)
-- =====================================================

-- Tabla de productos mejorada con sistema de costos y ganancias
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    barcode VARCHAR(50) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    
    -- Precio de costo (lo que pagas al proveedor)
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    
    -- Margen de ganancia deseado (porcentaje)
    profit_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00 CHECK (profit_margin >= 0 AND profit_margin <= 100),
    
    -- Precio de venta calculado automáticamente
    sale_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    
    -- Precio de venta manual (opcional, para sobrescribir el calculado)
    manual_sale_price DECIMAL(10,2) DEFAULT NULL CHECK (manual_sale_price >= 0),
    
    -- Stock y control de inventario
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 5 CHECK (min_stock >= 0),
    
    -- Campos adicionales para análisis
    last_cost_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NUEVAS TABLAS PARA SISTEMA DE GANANCIAS
-- =====================================================

-- Tabla de configuración de márgenes de ganancia por categoría
CREATE TABLE IF NOT EXISTS category_profit_margins (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    default_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 30.00 CHECK (default_profit_margin >= 0 AND default_profit_margin <= 100),
    min_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (min_profit_margin >= 0 AND min_profit_margin <= 100),
    max_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (max_profit_margin >= 0 AND max_profit_margin <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id)
);

-- Tabla de historial de cambios de costos
CREATE TABLE IF NOT EXISTS product_cost_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    previous_cost_price DECIMAL(10,2) NOT NULL,
    new_cost_price DECIMAL(10,2) NOT NULL,
    previous_profit_margin DECIMAL(5,2) NOT NULL,
    new_profit_margin DECIMAL(5,2) NOT NULL,
    previous_sale_price DECIMAL(10,2) NOT NULL,
    new_sale_price DECIMAL(10,2) NOT NULL,
    reason VARCHAR(200),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración global del sistema
CREATE TABLE IF NOT EXISTS profit_system_settings (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de análisis de rentabilidad
CREATE TABLE IF NOT EXISTS product_profit_analysis (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    units_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    profit_margin_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, period_month, period_year)
);

-- =====================================================
-- FUNCIONES PARA CÁLCULO AUTOMÁTICO
-- =====================================================

-- Función para calcular precio de venta basado en costo y margen de ganancia
CREATE OR REPLACE FUNCTION calculate_sale_price(cost_price DECIMAL, profit_margin DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- Fórmula: PV = PC / (1 - % de ganancias)
    IF profit_margin >= 100 THEN
        RETURN cost_price * 2; -- Evitar división por cero
    END IF;
    
    RETURN ROUND(cost_price / (1 - (profit_margin / 100)), 2);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular margen de ganancia real
CREATE OR REPLACE FUNCTION calculate_actual_margin(cost_price DECIMAL, sale_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF sale_price <= 0 OR cost_price <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(((sale_price - cost_price) / sale_price) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar precio de venta automáticamente
CREATE OR REPLACE FUNCTION update_product_sale_price()
RETURNS TRIGGER AS $$
DECLARE
    calculated_price DECIMAL;
    final_price DECIMAL;
BEGIN
    -- Si hay precio manual, usarlo
    IF NEW.manual_sale_price IS NOT NULL THEN
        final_price := NEW.manual_sale_price;
    ELSE
        -- Calcular precio basado en costo y margen
        final_price := calculate_sale_price(NEW.cost_price, NEW.profit_margin);
    END IF;
    
    NEW.sale_price := final_price;
    NEW.last_price_update := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar precio de venta automáticamente
CREATE TRIGGER update_product_sale_price_trigger
    BEFORE INSERT OR UPDATE OF cost_price, profit_margin, manual_sale_price ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_sale_price();

-- Función para registrar cambios de costos
CREATE OR REPLACE FUNCTION log_cost_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
        INSERT INTO product_cost_history (
            product_id,
            previous_cost_price,
            new_cost_price,
            previous_profit_margin,
            new_profit_margin,
            previous_sale_price,
            new_sale_price
        ) VALUES (
            NEW.id,
            COALESCE(OLD.cost_price, 0),
            NEW.cost_price,
            COALESCE(OLD.profit_margin, 0),
            NEW.profit_margin,
            COALESCE(OLD.sale_price, 0),
            NEW.sale_price
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios de costos
CREATE TRIGGER log_cost_change_trigger
    AFTER UPDATE OF cost_price ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_cost_change();

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
CREATE INDEX IF NOT EXISTS idx_products_profit_margin ON products(profit_margin);
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(sale_price);
CREATE INDEX IF NOT EXISTS idx_products_last_cost_update ON products(last_cost_update);
CREATE INDEX IF NOT EXISTS idx_products_last_price_update ON products(last_price_update);

CREATE INDEX IF NOT EXISTS idx_product_cost_history_product_id ON product_cost_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_history_created_at ON product_cost_history(created_at);

CREATE INDEX IF NOT EXISTS idx_product_profit_analysis_product_id ON product_profit_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_product_profit_analysis_period ON product_profit_analysis(period_year, period_month);

-- =====================================================
-- VISTAS PARA ANÁLISIS DE RENTABILIDAD
-- =====================================================

-- Vista de productos con análisis de rentabilidad
CREATE OR REPLACE VIEW product_profitability AS
SELECT 
    p.id,
    p.name,
    p.barcode,
    p.cost_price,
    p.profit_margin,
    p.sale_price,
    p.manual_sale_price,
    p.stock,
    c.name as category_name,
    
    -- Cálculo de ganancia por unidad
    (p.sale_price - p.cost_price) as profit_per_unit,
    
    -- Cálculo de margen de ganancia real
    CASE 
        WHEN p.sale_price > 0 THEN ROUND(((p.sale_price - p.cost_price) / p.sale_price) * 100, 2)
        ELSE 0
    END as actual_profit_margin,
    
    -- Valor total del inventario
    (p.stock * p.cost_price) as inventory_value_cost,
    (p.stock * p.sale_price) as inventory_value_sale,
    
    -- Potencial de ganancia en inventario
    (p.stock * (p.sale_price - p.cost_price)) as potential_profit,
    
    p.is_active,
    p.last_cost_update,
    p.last_price_update,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true;

-- Vista de productos con baja rentabilidad
CREATE OR REPLACE VIEW low_profit_products AS
SELECT 
    p.*,
    (p.sale_price - p.cost_price) as profit_per_unit,
    ROUND(((p.sale_price - p.cost_price) / p.sale_price) * 100, 2) as actual_margin
FROM products p
WHERE p.is_active = true
AND p.cost_price > 0
AND p.sale_price > 0
AND ROUND(((p.sale_price - p.cost_price) / p.sale_price) * 100, 2) < p.profit_margin
ORDER BY actual_margin ASC;

-- Vista de productos más rentables
CREATE OR REPLACE VIEW top_profit_products AS
SELECT 
    p.*,
    (p.sale_price - p.cost_price) as profit_per_unit,
    ROUND(((p.sale_price - p.cost_price) / p.sale_price) * 100, 2) as actual_margin
FROM products p
WHERE p.is_active = true
AND p.cost_price > 0
AND p.sale_price > 0
ORDER BY (p.sale_price - p.cost_price) DESC;

-- Vista de análisis de rentabilidad por categoría
CREATE OR REPLACE VIEW category_profit_analysis AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    COUNT(p.id) as product_count,
    SUM(p.stock * p.cost_price) as total_inventory_cost,
    SUM(p.stock * p.sale_price) as total_inventory_value,
    AVG(p.profit_margin) as avg_profit_margin,
    SUM(p.stock * (p.sale_price - p.cost_price)) as total_potential_profit
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name
ORDER BY total_potential_profit DESC;

-- =====================================================
-- DATOS INICIALES PARA SISTEMA DE GANANCIAS
-- =====================================================

-- Configuración de márgenes de ganancia por categoría
INSERT INTO category_profit_margins (category_id, default_profit_margin, min_profit_margin, max_profit_margin) VALUES
(1, 35.00, 20.00, 50.00), -- Electrónicos (35% por defecto)
(2, 25.00, 15.00, 40.00), -- Alimentos (25% por defecto)
(3, 45.00, 30.00, 60.00), -- Ropa (45% por defecto)
(4, 40.00, 25.00, 55.00)  -- Hogar (40% por defecto)
ON CONFLICT (category_id) DO NOTHING;

-- Configuración global del sistema de ganancias
INSERT INTO profit_system_settings (key_name, value, description) VALUES
('default_profit_margin', '30.00', 'Margen de ganancia por defecto para nuevos productos'),
('min_profit_margin', '10.00', 'Margen de ganancia mínimo permitido'),
('max_profit_margin', '60.00', 'Margen de ganancia máximo permitido'),
('auto_price_update', 'true', 'Actualizar precios automáticamente cuando cambia el costo'),
('price_rounding', '0.01', 'Incremento mínimo para redondeo de precios'),
('enable_profit_alerts', 'true', 'Activar alertas cuando el margen real es menor al esperado')
ON CONFLICT (key_name) DO NOTHING;

-- =====================================================
-- FUNCIONES AUXILIARES PARA REPORTES
-- =====================================================

-- Función para actualizar análisis de rentabilidad
CREATE OR REPLACE FUNCTION update_product_profit_analysis(product_id INTEGER, month INTEGER, year INTEGER)
RETURNS VOID AS $$
DECLARE
    units_sold_count INTEGER;
    total_revenue_amount DECIMAL(12,2);
    total_cost_amount DECIMAL(12,2);
    gross_profit_amount DECIMAL(12,2);
    profit_margin_calc DECIMAL(5,2);
BEGIN
    -- Obtener datos de ventas del período
    SELECT 
        COALESCE(SUM(si.quantity), 0),
        COALESCE(SUM(si.subtotal), 0)
    INTO units_sold_count, total_revenue_amount
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE si.product_id = product_id
    AND EXTRACT(MONTH FROM s.created_at) = month
    AND EXTRACT(YEAR FROM s.created_at) = year
    AND s.status = 'completed';
    
    -- Calcular costos totales
    SELECT 
        COALESCE(SUM(si.quantity * p.cost_price), 0)
    INTO total_cost_amount
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE si.product_id = product_id
    AND EXTRACT(MONTH FROM s.created_at) = month
    AND EXTRACT(YEAR FROM s.created_at) = year
    AND s.status = 'completed';
    
    -- Calcular ganancia bruta
    gross_profit_amount := total_revenue_amount - total_cost_amount;
    
    -- Calcular margen de ganancia
    IF total_revenue_amount > 0 THEN
        profit_margin_calc := ROUND((gross_profit_amount / total_revenue_amount) * 100, 2);
    ELSE
        profit_margin_calc := 0;
    END IF;
    
    -- Insertar o actualizar análisis
    INSERT INTO product_profit_analysis (product_id, period_month, period_year, units_sold, total_revenue, total_cost, gross_profit, profit_margin_percent)
    VALUES (product_id, month, year, units_sold_count, total_revenue_amount, total_cost_amount, gross_profit_amount, profit_margin_calc)
    ON CONFLICT (product_id, period_month, period_year)
    DO UPDATE SET
        units_sold = units_sold_count,
        total_revenue = total_revenue_amount,
        total_cost = total_cost_amount,
        gross_profit = gross_profit_amount,
        profit_margin_percent = profit_margin_calc;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Otorgar permisos a las nuevas tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON category_profit_margins TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_cost_history TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON profit_system_settings TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_profit_analysis TO app_user;

-- Otorgar permisos a las vistas
GRANT SELECT ON product_profitability TO app_user;
GRANT SELECT ON low_profit_products TO app_user;
GRANT SELECT ON top_profit_products TO app_user;
GRANT SELECT ON category_profit_analysis TO app_user;

-- =====================================================
-- FIN DEL ESQUEMA MEJORADO
-- =====================================================

-- Mensaje de confirmación
SELECT 'Base de datos con sistema de ganancias inicializada correctamente' as status;