export async function fetchProducts() {
 const res = await fetch("/api/products");
 if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
 return res.json();
}