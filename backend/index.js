require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const promClient = require("prom-client");

const app = express();

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use(cors());
app.use(express.json());

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function formatMoney(value) {
  return Number(value).toFixed(2);
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
  const customerFields = ["name", "email", "address", "city", "postcode"];

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
    (item) =>
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
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
        throw new Error(`Only ${product.stock_qty} units left for ${product.name}`);
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
      error: error.message || "Unable to place the order right now",
    });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;

pool
  .query("SELECT 1")
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database", error);
    process.exit(1);
  });
