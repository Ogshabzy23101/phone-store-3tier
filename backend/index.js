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
 try {
  const result = await pool.query("SELECT * FROM products");
  res.json(result.rows);
 } catch (err) {
  console.error(err);
  res.status(500).json({ error: "Database error" });
 }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
 console.log(`Server running on port ${PORT}`);
});