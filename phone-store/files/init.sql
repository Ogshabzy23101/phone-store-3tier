CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'phones',
      description TEXT NOT NULL DEFAULT '',
      price_gbp NUMERIC(10, 2) NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      stock_qty INTEGER NOT NULL DEFAULT 0,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON products (sku);

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      customer_city TEXT NOT NULL,
      customer_postcode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      total_gbp NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price_gbp NUMERIC(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_gbp NUMERIC(10,2) NOT NULL
    );

    INSERT INTO products (
      sku,
      name,
      brand,
      category,
      description,
      price_gbp,
      image_url,
      stock_qty,
      featured
    )
    VALUES
      (
        'apple-iphone-15',
        'iPhone 15',
        'Apple',
        'phones',
        'A reliable everyday flagship with a bright display, great cameras, and strong battery life.',
        799.00,
        '',
        14,
        TRUE
      ),
      (
        'samsung-galaxy-s24',
        'Galaxy S24',
        'Samsung',
        'phones',
        'Compact Android flagship with a vivid screen, fast performance, and useful camera features.',
        699.00,
        '',
        18,
        TRUE
      ),
      (
        'google-pixel-8',
        'Pixel 8',
        'Google',
        'phones',
        'Clean Android experience with smart software features and dependable point-and-shoot cameras.',
        599.00,
        '',
        12,
        FALSE
      ),
      (
        'oneplus-12',
        'OnePlus 12',
        'OnePlus',
        'phones',
        'Fast charging, smooth performance, and plenty of storage for users who want strong value.',
        649.00,
        '',
        9,
        FALSE
      ),
      (
        'apple-macbook-air-13-m3',
        'MacBook Air 13 M3',
        'Apple',
        'laptops',
        'Lightweight laptop with long battery life, a sharp display, and strong day-to-day performance.',
        1099.00,
        '',
        7,
        TRUE
      ),
      (
        'dell-xps-13',
        'Dell XPS 13',
        'Dell',
        'laptops',
        'Premium Windows ultrabook with a compact design, crisp screen, and great portability.',
        999.00,
        '',
        6,
        FALSE
      ),
      (
        'lenovo-thinkpad-e14',
        'ThinkPad E14',
        'Lenovo',
        'laptops',
        'Practical business laptop with solid keyboard comfort and reliable performance for office work.',
        849.00,
        '',
        11,
        FALSE
      ),
      (
        'anker-65w-usb-c-charger',
        '65W USB-C Charger',
        'Anker',
        'accessories',
        'Compact fast charger that can power most phones, tablets, and many modern laptops.',
        39.00,
        '',
        30,
        FALSE
      ),
      (
        'logitech-mx-master-3s',
        'MX Master 3S',
        'Logitech',
        'accessories',
        'Comfortable wireless productivity mouse with precise tracking and quiet clicks.',
        99.00,
        '',
        16,
        TRUE
      ),
      (
        'sony-wh-1000xm5',
        'WH-1000XM5',
        'Sony',
        'accessories',
        'Noise-cancelling headphones with strong sound quality for work, travel, and focus sessions.',
        329.00,
        '',
        10,
        FALSE
      ),
      (
        'samsung-t7-1tb-ssd',
        'T7 Portable SSD 1TB',
        'Samsung',
        'accessories',
        'Portable storage option for backups, large files, and moving projects between devices.',
        119.00,
        '',
        20,
        FALSE
      )
    ON CONFLICT (sku) DO UPDATE SET
      name = EXCLUDED.name,
      brand = EXCLUDED.brand,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      price_gbp = EXCLUDED.price_gbp,
      image_url = EXCLUDED.image_url,
      stock_qty = EXCLUDED.stock_qty,
      featured = EXCLUDED.featured;