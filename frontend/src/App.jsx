import { useEffect, useState } from "react";
import { fetchProductById, fetchProducts } from "./api/products";
import { submitOrder } from "./api/orders";
import { formatPrice, sentenceCaseCategory } from "./lib/format";
import "./App.css";

const categories = ["all", "phones", "laptops", "accessories"];
const categoryIcons = {
  phones: "📱",
  laptops: "💻",
  accessories: "🎧",
};
const cartStorageKey = "phone-store-cart";

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "product" && parts[1]) {
    return { page: "product", productId: parts[1] };
  }

  if (parts[0] === "cart") {
    return { page: "cart" };
  }

  if (parts[0] === "checkout") {
    return { page: "checkout" };
  }

  return { page: "catalog" };
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function readStoredCart() {
  try {
    const rawValue = window.localStorage.getItem(cartStorageKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((item) => ({
        productId: Number.parseInt(item.productId, 10),
        quantity: Number.parseInt(item.quantity, 10),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.productId) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );
  } catch {
    return [];
  }
}

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div className="product-card__media" aria-hidden="true">
        <span>{categoryIcons[product.category] || "🛍️"}</span>
      </div>
      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="badge">{sentenceCaseCategory(product.category)}</span>
          {product.featured ? <span className="badge badge--accent">Featured</span> : null}
        </div>
        <h3>{product.name}</h3>
        <p className="product-card__brand">{product.brand}</p>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <strong>{formatPrice(product.price_gbp)}</strong>
          <span>{product.stock_qty} in stock</span>
        </div>
        <div className="product-card__actions">
          <button type="button" className="button button--ghost" onClick={() => navigateTo(`/product/${product.id}`)}>
            View details
          </button>
          <button type="button" className="button" onClick={() => onAddToCart(product.id, 1)}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

function CartRow({ item, product, onUpdateQuantity, onRemove }) {
  const lineTotal = Number(product.price_gbp) * item.quantity;

  return (
    <div className="cart-row">
      <div>
        <h3>{product.name}</h3>
        <p>
          {product.brand} • {sentenceCaseCategory(product.category)}
        </p>
        <button type="button" className="text-button" onClick={() => navigateTo(`/product/${product.id}`)}>
          View product
        </button>
      </div>
      <div className="cart-row__controls">
        <label>
          Qty
          <input
            type="number"
            min="1"
            max={product.stock_qty}
            value={item.quantity}
            onChange={(event) => onUpdateQuantity(product.id, event.target.value)}
          />
        </label>
        <strong>{formatPrice(lineTotal)}</strong>
        <button type="button" className="text-button text-button--danger" onClick={() => onRemove(product.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState(() => readStoredCart());
  const [productDetail, setProductDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postcode: "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    function onHashChange() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", onHashChange);

    if (!window.location.hash) {
      navigateTo("/");
    }

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setCatalogLoading(true);
        setCatalogError("");
        const data = await fetchProducts();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error.message || "Failed to load products");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let cancelled = false;

    async function loadProductDetail(productId) {
      try {
        setDetailLoading(true);
        setDetailError("");
        const knownProduct = products.find((product) => product.id === Number(productId));

        if (knownProduct) {
          setProductDetail(knownProduct);
          setDetailLoading(false);
          return;
        }

        const data = await fetchProductById(productId);

        if (!cancelled) {
          setProductDetail(data);
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(error.message || "Failed to load product details");
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    if (route.page === "product") {
      loadProductDetail(route.productId);
    } else {
      setProductDetail(null);
      setDetailError("");
    }

    return () => {
      cancelled = true;
    };
  }, [route, products]);

  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);
  const cartProducts = cart
    .map((item) => ({
      item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((entry) => entry.product);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartProducts.reduce(
    (sum, entry) => sum + Number(entry.product.price_gbp) * entry.item.quantity,
    0
  );

  function addToCart(productId, quantity) {
    const product = products.find((entry) => entry.id === productId);

    if (!product) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId);

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.stock_qty),
              }
            : item
        );
      }

      return [...currentCart, { productId, quantity: Math.min(quantity, product.stock_qty) }];
    });
  }

  function updateCartQuantity(productId, value) {
    const nextQuantity = Number.parseInt(value, 10);
    const product = products.find((entry) => entry.id === productId);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || !product) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(nextQuantity, product.stock_qty) }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (cartProducts.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError("");

      const order = await submitOrder({
        customer: checkoutForm,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      setSubmittedOrder(order);
      setCart([]);
      setCheckoutForm({
        name: "",
        email: "",
        address: "",
        city: "",
        postcode: "",
      });
      navigateTo("/checkout");
    } catch (error) {
      setCheckoutError(error.message || "Failed to place order");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function renderCatalogPage() {
    return (
      <>
        <section className="hero">
          <div>
            <p className="eyebrow">3-tier e-commerce demo</p>
            <h1>Phone Store now covers phones, laptops, and everyday tech accessories.</h1>
            <p className="hero__copy">
              Explore a richer catalog, browse by category, and walk through a simple cart and checkout flow.
            </p>
            <div className="hero__actions">
              <button type="button" className="button" onClick={() => navigateTo("/cart")}>
                Open cart
              </button>
              <button type="button" className="button button--ghost" onClick={() => setSelectedCategory("phones")}>
                Shop phones
              </button>
            </div>
          </div>
          <div className="hero__panel">
            <div>
              <strong>{products.length}</strong>
              <span>Products</span>
            </div>
            <div>
              <strong>{categories.length - 1}</strong>
              <span>Categories</span>
            </div>
            <div>
              <strong>{cartCount}</strong>
              <span>Items in cart</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="eyebrow">Featured picks</p>
              <h2>Good starter products for a demo storefront</h2>
            </div>
          </div>
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="featured-card">
                <span>{categoryIcons[product.category] || "🛍️"}</span>
                <strong>{product.name}</strong>
                <p>{product.description}</p>
                <button type="button" className="text-button" onClick={() => navigateTo(`/product/${product.id}`)}>
                  View details
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Browse products by category</h2>
            </div>
            <div className="filter-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === selectedCategory ? "chip chip--active" : "chip"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {sentenceCaseCategory(category)}
                </button>
              ))}
            </div>
          </div>

          {catalogLoading ? <p className="status-card">Loading products…</p> : null}
          {catalogError ? <p className="status-card status-card--error">{catalogError}</p> : null}

          {!catalogLoading && !catalogError ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : null}
        </section>
      </>
    );
  }

  function renderProductPage() {
    if (detailLoading) {
      return <p className="status-card">Loading product details…</p>;
    }

    if (detailError) {
      return <p className="status-card status-card--error">{detailError}</p>;
    }

    if (!productDetail) {
      return <p className="status-card">Product not found.</p>;
    }

    return (
      <section className="detail-layout">
        <div className="detail-media" aria-hidden="true">
          <span>{categoryIcons[productDetail.category] || "🛍️"}</span>
        </div>
        <div className="detail-content">
          <div className="product-card__meta">
            <span className="badge">{sentenceCaseCategory(productDetail.category)}</span>
            {productDetail.featured ? <span className="badge badge--accent">Featured</span> : null}
          </div>
          <h1>{productDetail.name}</h1>
          <p className="detail-brand">{productDetail.brand}</p>
          <p className="detail-copy">{productDetail.description}</p>
          <div className="detail-stats">
            <div>
              <span>Price</span>
              <strong>{formatPrice(productDetail.price_gbp)}</strong>
            </div>
            <div>
              <span>Stock</span>
              <strong>{productDetail.stock_qty} available</strong>
            </div>
          </div>
          <div className="detail-actions">
            <button type="button" className="button" onClick={() => addToCart(productDetail.id, 1)}>
              Add to cart
            </button>
            <button type="button" className="button button--ghost" onClick={() => navigateTo("/")}>
              Back to catalog
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderCartPage() {
    return (
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">Cart</p>
            <h1>Your basket</h1>
          </div>
        </div>

        {cartProducts.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add a few products from the catalog to try the checkout flow.</p>
            <button type="button" className="button" onClick={() => navigateTo("/")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="card-stack">
              {cartProducts.map(({ item, product }) => (
                <CartRow
                  key={product.id}
                  item={item}
                  product={product}
                  onUpdateQuantity={updateCartQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <aside className="summary-card">
              <h2>Order summary</h2>
              <div className="summary-row">
                <span>Items</span>
                <strong>{cartCount}</strong>
              </div>
              <div className="summary-row">
                <span>Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>
              <button type="button" className="button" onClick={() => navigateTo("/checkout")}>
                Go to checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    );
  }

  function renderCheckoutPage() {
    return (
      <section className="checkout-layout">
        <div className="checkout-panel">
          <p className="eyebrow">Checkout</p>
          <h1>Place a demo order</h1>
          <p>
            This keeps the flow intentionally simple so it is easy to follow in a beginner-friendly full-stack project.
          </p>

          {submittedOrder ? (
            <div className="status-card status-card--success">
              <h2>Order placed</h2>
              <p>Order #{submittedOrder.orderId} has been submitted successfully.</p>
              <p>Total charged: {formatPrice(submittedOrder.totalGbp)}</p>
            </div>
          ) : null}

          {checkoutError ? <p className="status-card status-card--error">{checkoutError}</p> : null}

          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <label>
              Full name
              <input
                type="text"
                value={checkoutForm.name}
                onChange={(event) =>
                  setCheckoutForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={checkoutForm.email}
                onChange={(event) =>
                  setCheckoutForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={checkoutForm.address}
                onChange={(event) =>
                  setCheckoutForm((current) => ({ ...current, address: event.target.value }))
                }
                required
              />
            </label>
            <div className="checkout-form__split">
              <label>
                City
                <input
                  type="text"
                  value={checkoutForm.city}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({ ...current, city: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Postcode
                <input
                  type="text"
                  value={checkoutForm.postcode}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({ ...current, postcode: event.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <button type="submit" className="button" disabled={checkoutLoading || cartProducts.length === 0}>
              {checkoutLoading ? "Submitting order…" : "Submit order"}
            </button>
          </form>
        </div>

        <aside className="summary-card">
          <h2>Cart summary</h2>
          {cartProducts.length === 0 ? <p>No items in cart.</p> : null}
          {cartProducts.map(({ item, product }) => (
            <div key={product.id} className="summary-line">
              <span>
                {product.name} x {item.quantity}
              </span>
              <strong>{formatPrice(Number(product.price_gbp) * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>Total</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>
          <button type="button" className="button button--ghost" onClick={() => navigateTo("/cart")}>
            Edit cart
          </button>
        </aside>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => navigateTo("/")}>
          <span className="brand__mark">PS</span>
          <span>
            <strong>Phone Store</strong>
            <small>3-tier e-commerce demo</small>
          </span>
        </button>

        <nav className="nav-links" aria-label="Primary">
          <button type="button" className="text-button" onClick={() => navigateTo("/")}>
            Catalog
          </button>
          <button type="button" className="text-button" onClick={() => navigateTo("/cart")}>
            Cart ({cartCount})
          </button>
          <button type="button" className="text-button" onClick={() => navigateTo("/checkout")}>
            Checkout
          </button>
        </nav>
      </header>

      <main className="page-content">
        {route.page === "catalog" ? renderCatalogPage() : null}
        {route.page === "product" ? renderProductPage() : null}
        {route.page === "cart" ? renderCartPage() : null}
        {route.page === "checkout" ? renderCheckoutPage() : null}
      </main>
    </div>
  );
}
