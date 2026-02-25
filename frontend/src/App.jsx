import { useEffect, useState } from "react";
import { fetchProducts } from "./api/products";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setErrorMsg(err.message || "Failed to fetch products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>Phone Store (React)</h1>

      {loading && <p>Loading products…</p>}
      {errorMsg && <p style={{ color: "crimson" }}>Error: {errorMsg}</p>}

      {!loading && !errorMsg && (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> — {p.brand} — £{p.price_gbp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
