# Frontend

This folder contains the React/Vite frontend for the phone store application.

## What This Folder Contains

- `src/App.jsx`
  - main UI flow for catalog, product detail, cart, and checkout
- `src/api/`
  - frontend API helpers for products and orders
- `src/lib/format.js`
  - presentation helpers such as GBP formatting
- `vite.config.js`
  - Vite dev server settings and `/api` proxy behavior
- `nginx.conf`
  - production reverse-proxy configuration used by the Nginx image
- `Dockerfile.dev`
  - development image for Compose
- `Dockerfile.prod`
  - production frontend image build

## How It Fits Into the Project

The frontend is the presentation tier:

- renders the product catalog and checkout flow
- calls the backend API through `/api`
- is served by Vite in development
- is served by Nginx in production and Kubernetes

## Important Commands

Install dependencies:

```bash
cd frontend
npm ci
```

Run locally:

```bash
cd frontend
npm run dev
```

Build production assets:

```bash
cd frontend
npm run build
```

Lint:

```bash
cd frontend
npm run lint
```

## API Routing Notes

Development:

- Vite proxies `/api` to the backend target defined in `vite.config.js`
- the default fallback target is `http://localhost:5000`

Production:

- Nginx serves `index.html`
- `/api/` is proxied to the backend service/container

## Common Mistakes

- seeing a blank or stale UI because the browser is still using an old image or cached asset
- checkout calls failing with `405` if the frontend is pointed at an Nginx path that does not proxy `POST /api/orders`
- local frontend working but API failing because the backend is not reachable on the configured proxy target

## Security Notes

- frontend environment values prefixed with `VITE_` are exposed to the client bundle
- never place real secrets in Vite client-side variables
