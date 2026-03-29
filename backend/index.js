require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const seededProducts = [
  {
    sku: "apple-iphone-15",
    name: "iPhone 15",
    brand: "Apple",
    category: "phones",
    description:
      "A reliable everyday flagship with a bright display, great cameras, and strong battery life.",
    priceGbp: 799,
    imageUrl: "",
    stockQty: 14,
    featured: true,
  },
  {
    sku: "samsung-galaxy-s24",
    name: "Galaxy S24",
    brand: "Samsung",
    category: "phones",
    description:
      "Compact Android flagship with a vivid screen, fast performance, and useful camera features.",
    priceGbp: 699,
    imageUrl: "",
    stockQty: 18,
    featured: true,
  },
  {
    sku: "google-pixel-8",
    name: "Pixel 8",
    brand: "Google",
    category: "phones",
    description:
      "Clean Android experience with smart software features and dependable point-and-shoot cameras.",
    priceGbp: 599,
    imageUrl: "",
    stockQty: 12,
    featured: false,
  },
  {
    sku: "oneplus-12",
    name: "OnePlus 12",
    brand: "OnePlus",
    category: "phones",
    description:
      "Fast charging, smooth performance, and plenty of storage for users who want strong value.",
    priceGbp: 649,
    imageUrl: "",
    stockQty: 9,
    featured: false,
  },
  {
    sku: "apple-macbook-air-13-m3",
    name: "MacBook Air 13 M3",
    brand: "Apple",
    category: "laptops",
    description:
      "Lightweight laptop with long battery life, a sharp display, and strong day-to-day performance.",
    priceGbp: 1099,
    imageUrl: "",
    stockQty: 7,
    featured: true,
  },
  {
    sku: "dell-xps-13",
    name: "Dell XPS 13",
    brand: "Dell",
    category: "laptops",
    description:
      "Premium Windows ultrabook with a compact design, crisp screen, and great portability.",
    priceGbp: 999,
    imageUrl: "",
    stockQty: 6,
    featured: false,
  },
  {
    sku: "lenovo-thinkpad-e14",
    name: "ThinkPad E14",
    brand: "Lenovo",
    category: "laptops",
    description:
      "Practical business laptop with solid keyboard comfort and reliable performance for office work.",
    priceGbp: 849,
    imageUrl: "",
    stockQty: 11,
    featured: false,
  },
  {
    sku: "anker-65w-usb-c-charger",
    name: "65W USB-C Charger",
    brand: "Anker",
    category: "accessories",
    description:
      "Compact fast charger that can power most phones, tablets, and many modern laptops.",
    priceGbp: 39,
    imageUrl: "",
    stockQty: 30,
    featured: false,
  },
  {
    sku: "logitech-mx-master-3s",
    name: "MX Master 3S",
    brand: "Logitech",
    category: "accessories",
    description:
      "Comfortable wireless productivity mouse with precise tracking and quiet clicks.",
    priceGbp: 99,
    imageUrl: "",
    stockQty: 16,
    featured: true,
  },
  {
    sku: "sony-wh-1000xm5",
    name: "WH-1000XM5",
    brand: "Sony",
    category: "accessories",
    description:
      "Noise-cancelling headphones with strong sound quality for work, travel, and focus sessions.",
    priceGbp: 329,
    imageUrl: "",
    stockQty: 10,
    featured: false,
  },
  {
    sku: "samsung-t7-1tb-ssd",
    name: "T7 Portable SSD 1TB",
    brand: "Samsung",
    category: "accessories",
    description:
      "Portable storage option for backups, large files, and moving projects between devices.",
    priceGbp: 119,
    imageUrl: "",
    stockQty: 20,
    featured: false,
  },
];

function formatMoney(value) {
  return Number(value).toFixed(2);
}

async function initializeDatabase() {
  await pool.query(`
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
    )
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'phones',
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS stock_qty INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON products (sku)
  `);

  for (const product of seededProducts) {
    await pool.query(
      `
        UPDATE products
        SET
          sku = $1,
          brand = $3,
          category = $4,
          description = $5,
          price_gbp = $6,
          image_url = $7,
          stock_qty = $8,
          featured = $9
        WHERE name = $2 AND (sku IS NULL OR sku = '')
      `,
      [
        product.sku,
        product.name,
        product.brand,
        product.category,
        product.description,
        formatMoney(product.priceGbp),
        product.imageUrl,
        product.stockQty,
        product.featured,
      ]
    );
  }

  await pool.query(`
    UPDATE products
    SET sku = 'legacy-' || id
    WHERE sku IS NULL OR sku = ''
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      customer_city TEXT NOT NULL,
      customer_postcode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      total_gbp NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price_gbp NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_gbp NUMERIC(10, 2) NOT NULL
    )
  `);

  for (const product of seededProducts) {
    await pool.query(
      `
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (sku)
        DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          price_gbp = EXCLUDED.price_gbp,
          image_url = EXCLUDED.image_url,
          stock_qty = EXCLUDED.stock_qty,
          featured = EXCLUDED.featured
      `,
      [
        product.sku,
        product.name,
        product.brand,
        product.category,
        product.description,
        formatMoney(product.priceGbp),
        product.imageUrl,
        product.stockQty,
        product.featured,
      ]
    );
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch (error) {
    res.status(500).json({ status: "not ready", error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  const { category } = req.query;
  const hasCategoryFilter =
    typeof category === "string" && category.trim() !== "" && category !== "all";

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          sku,
          name,
          brand,
          category,
          description,
          price_gbp,
          image_url,
          stock_qty,
          featured
        FROM products
        WHERE ($1::text IS NULL OR category = $1)
        ORDER BY featured DESC, category ASC, brand ASC, name ASC
      `,
      [hasCategoryFilter ? category : null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const productId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          sku,
          name,
          brand,
          category,
          description,
          price_gbp,
          image_url,
          stock_qty,
          featured
        FROM products
        WHERE id = $1
      `,
      [productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/orders", async (req, res) => {
  const customer = req.body?.customer ?? {};
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const customerFields = [
    "name",
    "email",
    "address",
    "city",
    "postcode",
  ];

  for (const field of customerFields) {
    if (typeof customer[field] !== "string" || customer[field].trim() === "") {
      return res
        .status(400)
        .json({ error: `Customer ${field} is required` });
    }
  }

  if (rawItems.length === 0) {
    return res.status(400).json({ error: "At least one order item is required" });
  }

  const items = rawItems.map((item) => ({
    productId: Number.parseInt(item.productId, 10),
    quantity: Number.parseInt(item.quantity, 10),
  }));

  const invalidItem = items.find(
    (item) => !Number.isInteger(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1
  );

  if (invalidItem) {
    return res
      .status(400)
      .json({ error: "Each item must include a valid productId and quantity" });
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productsResult = await client.query(
      `
        SELECT id, name, price_gbp, stock_qty
        FROM products
        WHERE id = ANY($1::int[])
        FOR UPDATE
      `,
      [productIds]
    );

    if (productsResult.rowCount !== productIds.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "One or more products were not found" });
    }

    const productsById = new Map(
      productsResult.rows.map((product) => [product.id, product])
    );

    let orderTotal = 0;
    const normalizedItems = items.map((item) => {
      const product = productsById.get(item.productId);

      if (item.quantity > product.stock_qty) {
        throw new Error(
          `Only ${product.stock_qty} units left for ${product.name}`
        );
      }

      const unitPrice = Number(product.price_gbp);
      const lineTotal = unitPrice * item.quantity;
      orderTotal += lineTotal;

      return {
        ...item,
        productName: product.name,
        unitPrice,
        lineTotal,
      };
    });

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          customer_name,
          customer_email,
          customer_address,
          customer_city,
          customer_postcode,
          total_gbp
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, status, total_gbp, created_at
      `,
      [
        customer.name.trim(),
        customer.email.trim(),
        customer.address.trim(),
        customer.city.trim(),
        customer.postcode.trim(),
        formatMoney(orderTotal),
      ]
    );

    const order = orderResult.rows[0];

    for (const item of normalizedItems) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            unit_price_gbp,
            quantity,
            line_total_gbp
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          order.id,
          item.productId,
          item.productName,
          formatMoney(item.unitPrice),
          item.quantity,
          formatMoney(item.lineTotal),
        ]
      );

      await client.query(
        `
          UPDATE products
          SET stock_qty = stock_qty - $1
          WHERE id = $2
        `,
        [item.quantity, item.productId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      orderId: order.id,
      status: order.status,
      totalGbp: order.total_gbp,
      createdAt: order.created_at,
      items: normalizedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceGbp: formatMoney(item.unitPrice),
        lineTotalGbp: formatMoney(item.lineTotal),
      })),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(400).json({
      error:
        error.message || "Unable to place the order right now",
    });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
