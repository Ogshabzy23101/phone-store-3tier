import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [product, setProduct] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Products store (api test)</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {product.length === 0 && !error ? (
        <p>Loading products...</p>
      ) : (
        <ul>
          {product.map((prod) => (
            <li key={prod.id}>
              {prod.name} {prod.brand} - gbp{prod.price_gbp}{" "}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
