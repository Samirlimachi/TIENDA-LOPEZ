-- Script completo para crear la base de datos de TiendaLopez
-- Ejecutar contra la base `defaultdb` de Aiven (ya existe, no hace falta crearla).

USE defaultdb;

-- 1. Categorías de productos
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Marcas
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Temáticas (usadas por productos de la categoría Cotillón, ej. Superhéroes, Princesas)
CREATE TABLE IF NOT EXISTS tematicas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 4. Usuarios del sistema (admin / vendedor)
-- is_approved: un vendedor recién registrado no puede entrar hasta que un admin lo apruebe.
-- is_active: el admin puede desactivar una cuenta para bloquear el acceso sin borrarla.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  category_id INT NOT NULL,
  brand_id INT NULL,
  tematica_id INT NULL,
  image_url VARCHAR(255) NULL,
  price DECIMAL(10, 2) NULL,
  price2 DECIMAL(10, 2) NULL,
  cost_price DECIMAL(10, 2) NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (tematica_id) REFERENCES tematicas(id)
);

-- 5b. Fotos de producto (un producto puede tener varias).
-- La imagen se guarda como binario (data) directamente en la base, no como ruta de archivo.
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  data MEDIUMBLOB NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. Por si las tablas ya existían de antes, sin estas columnas
-- (MySQL no soporta ADD COLUMN IF NOT EXISTS, setup.ts ignora el error si la columna ya existe)
ALTER TABLE products ADD COLUMN brand_id INT NULL;
ALTER TABLE products ADD COLUMN tematica_id INT NULL;
ALTER TABLE products ADD COLUMN image_url VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN price2 DECIMAL(10, 2) NULL;
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) NULL;
ALTER TABLE products ADD COLUMN code VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL UNIQUE;
ALTER TABLE product_images ADD COLUMN data MEDIUMBLOB NULL;
ALTER TABLE product_images ADD COLUMN mime_type VARCHAR(50) NULL DEFAULT 'image/jpeg';
-- La columna vieja image_url era obligatoria, ahora que no se usa se vuelve opcional.
ALTER TABLE product_images MODIFY COLUMN image_url VARCHAR(255) NULL;

-- Los usuarios de prueba creados antes de agregar is_approved quedan aprobados
-- (para no bloquear las cuentas admin/vendedor1 usadas durante el desarrollo).
UPDATE users SET is_approved = 1, is_active = 1 WHERE username IN ('admin', 'vendedor1');

-- Las fotos viejas se guardaban como ruta de archivo (image_url), sin el binario (data).
-- Ahora que las fotos se guardan como blob, esas filas quedaron obsoletas.
DELETE FROM product_images WHERE data IS NULL;

-- Los productos que ya existían antes de agregar code reciben uno generado a partir de su id.
UPDATE products SET code = CONCAT('PROD-', id) WHERE code IS NULL;
ALTER TABLE products MODIFY COLUMN code VARCHAR(50) NOT NULL;
ALTER TABLE products ADD UNIQUE INDEX idx_products_code (code);
-- Precio 1 y Precio 2 pasan a ser cada uno opcional (con tal de que haya al menos uno).
ALTER TABLE products MODIFY COLUMN price DECIMAL(10, 2) NULL;

-- 6b. Clientes: se buscan por nombre, CI o NIT para no reescribirlos en cada venta.
-- CI y NIT son cada uno opcional e independiente (no todos los clientes tienen ambos).
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  ci VARCHAR(50) NULL,
  nit VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE customers ADD COLUMN ci VARCHAR(50) NULL;

-- 7. Ventas registradas por vendedores/admin.
-- Cada venta puede tener varios productos (sale_items). Guardamos nombre/código
-- del producto (y del cliente) en el momento de la venta (snapshot) para que el
-- historial no cambie si el producto o el cliente se editan más adelante.
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  customer_id INT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_ci VARCHAR(50) NULL,
  customer_nit VARCHAR(50) NULL,
  payment_method ENUM('qr', 'efectivo') NOT NULL DEFAULT 'efectivo',
  amount_received DECIMAL(10, 2) NOT NULL,
  change_given DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Ventas creadas antes de agregar estos campos: se completan con valores por
-- defecto razonables para no dejar filas con NOT NULL vacío.
ALTER TABLE sales ADD COLUMN customer_id INT NULL;
ALTER TABLE sales ADD COLUMN customer_name VARCHAR(150) NULL;
ALTER TABLE sales ADD COLUMN customer_ci VARCHAR(50) NULL;
ALTER TABLE sales ADD COLUMN customer_nit VARCHAR(50) NULL;
ALTER TABLE sales ADD COLUMN payment_method ENUM('qr', 'efectivo') NOT NULL DEFAULT 'efectivo';
ALTER TABLE sales ADD COLUMN amount_received DECIMAL(10, 2) NULL;
ALTER TABLE sales ADD COLUMN change_given DECIMAL(10, 2) NOT NULL DEFAULT 0;
UPDATE sales SET customer_name = 'Sin nombre' WHERE customer_name IS NULL;
UPDATE sales SET amount_received = total WHERE amount_received IS NULL;
ALTER TABLE sales MODIFY COLUMN customer_name VARCHAR(150) NOT NULL;
ALTER TABLE sales MODIFY COLUMN amount_received DECIMAL(10, 2) NOT NULL;

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 8. Categorías iniciales
INSERT IGNORE INTO categories (name) VALUES ('Material Escolar');
INSERT IGNORE INTO categories (name) VALUES ('Cotillón');
INSERT IGNORE INTO categories (name) VALUES ('Juguetes');

-- 9. Usuario admin por defecto (usuario: admin / contraseña: Lopez2026!)
-- La contraseña ya está hasheada con bcrypt, nunca se guarda en texto plano.
-- El admin siempre queda aprobado y activo, para no bloquearse a sí mismo.
INSERT IGNORE INTO users (username, password_hash, role, is_approved, is_active)
VALUES ('admin', '$2b$10$TGAVAodODMhtS1/WOa67AeWNgV.MwUoUbvv7qhmoWaBGnZV5qhPhO', 'admin', 1, 1);
