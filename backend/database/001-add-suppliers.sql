-- Crear tabla de proveedores si no existe
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna de proveedor a productos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE products ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id);
    END IF;
END
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_suppliers_timestamp ON suppliers;
CREATE TRIGGER update_suppliers_timestamp
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Insertar proveedores de ejemplo
INSERT INTO suppliers (name, email, phone, address, contact_person) VALUES
('Proveedor Tech', 'contacto@proveedortech.com', '555-0100', 'Avenida Industrial #500', 'Carlos López'),
('Distribuidora General', 'ventas@distribuidora.com', '555-0101', 'Boulevard Central #200', 'María García'),
('Importaciones Especiales', 'info@importaciones.com', '555-0102', 'Zona Franca #50', 'Juan Rodríguez')
ON CONFLICT (email) DO NOTHING;
