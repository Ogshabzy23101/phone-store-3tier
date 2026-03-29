export async function fetchProducts(category) {
  const searchParams = new URLSearchParams();

  if (category && category !== "all") {
    searchParams.set("category", category);
  }

  const response = await fetch(
    `/api/products${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products (${response.status})`);
  }

  return response.json();
}

export async function fetchProductById(productId) {
  const response = await fetch(`/api/products/${productId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch product (${response.status})`);
  }

  return response.json();
}
