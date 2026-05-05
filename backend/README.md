# Backend

This folder contains the Node.js/Express API for the phone store application.

## What This Folder Contains

- `index.js`
  - main API entry point
  - database connectivity
  - product and order routes
  - health, readiness, and metrics endpoints
- `package.json`
  - backend scripts and dependency definitions
- `eslint.config.mjs`
  - lint configuration for backend JavaScript
- `Dockerfile`
  - production container image build for the API

## How It Fits Into the Project

The backend is the middle tier of the application:

- the frontend calls it for product and checkout actions
- it validates requests and talks to PostgreSQL
- it exposes `/metrics` for Prometheus-style scraping

## Important Routes

- `GET /health`
- `GET /ready`
- `GET /metrics`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`

## Important Commands

Install and run locally:

```bash
cd backend
npm ci
npm run dev
```

Lint:

```bash
cd backend
npm run lint
```

Run with an explicit connection string:

```bash
DATABASE_URL=postgres://phonestore_admin:phonestore_password@localhost:5432/phonestore_db npm start
```

## Environment Variables

Supported variables:

- `PORT`
- `DATABASE_URL`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

If `DATABASE_URL` is not provided, the app builds one from the `DB_*` variables.

## Common Mistakes

- backend starts but cannot connect to Postgres because `DB_NAME` or `DATABASE_URL` is wrong
- `/api/orders` fails because the database was never initialized with the expanded schema
- metrics are unavailable because `/metrics` is not exposed through the current path you are testing

## Security Notes

- do not hardcode real database credentials in source or docs
- prefer Secrets or environment injection in shared environments
- treat the current demo values in the repo as placeholders for learning, not production-ready secrets
