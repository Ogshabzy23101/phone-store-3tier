# Project Walkthrough

This document explains the phone-store-3tier repository end to end as if you were presenting it to a reviewer, teammate, or interviewer.

## Original Project Goal

The original goal of the project is to take a small full-stack e-commerce application and use it as a vehicle for learning practical DevOps concepts. Instead of stopping at "the app works on my machine," the repository shows how to:

- build and run the app locally
- package the services into container images
- connect them with Docker Compose
- deploy them to a VM
- deploy them to Kubernetes
- add basic observability
- automate checks and deployments with GitHub Actions

## Why This Is a 3-Tier Architecture

The project is a 3-tier architecture because the responsibilities are clearly separated:

- frontend tier
  - React UI
  - collects user input and renders the store
- backend tier
  - Express API
  - validates requests and talks to the database
- database tier
  - PostgreSQL
  - stores the catalog and order records

This separation makes the system easier to reason about and easier to deploy using common DevOps patterns.

## How Frontend, Backend, and Database Communicate

The frontend never talks directly to the database.

Instead:

1. the browser calls frontend routes and assets
2. the frontend sends HTTP requests to `/api/...`
3. the backend handles those requests and runs SQL queries
4. PostgreSQL returns data to the backend
5. the backend returns JSON to the frontend

This keeps database access concentrated in one place and makes validation and business logic easier to manage.

## How Docker Images Are Built

The repository builds separate images for the frontend and backend.

### Backend image

- built from [`backend/Dockerfile`](../backend/Dockerfile)
- installs dependencies
- copies the API code
- runs the Express server

### Frontend image

- development image: [`frontend/Dockerfile.dev`](../frontend/Dockerfile.dev)
- production image: [`frontend/Dockerfile.prod`](../frontend/Dockerfile.prod)

The production frontend image builds the Vite app and serves the static files through Nginx.

## How Docker Compose Connects the Services

There are two Compose files:

- [`infra/docker/docker-compose.dev.yml`](../infra/docker/docker-compose.dev.yml)
- [`infra/docker/docker-compose.prod.yml`](../infra/docker/docker-compose.prod.yml)

### Development Compose

The development file:

- runs Postgres as `db`
- builds the backend from local source
- builds the frontend dev image
- mounts frontend source files into the container
- sets `VITE_API_BASE_URL=http://backend:5000`

This means the frontend can make `/api` calls while still enjoying a local development workflow.

### Production Compose

The production file:

- pulls tagged images instead of building them locally
- mounts `init.sql` into Postgres initialization
- serves the frontend on port `80`
- relies on `IMAGE_TAG` from `.env`

## How Production Differs From Development

Development and production differ in several important ways:

- development uses local builds and hot-reload-oriented frontend setup
- production uses prebuilt tagged images
- development exposes the Vite dev server
- production serves static frontend assets with Nginx
- development is optimized for quick edits
- production is optimized for repeatable deployment

## How Kubernetes Deployments, Services, Ingress, ConfigMaps, and Secrets Are Used

The Kubernetes path uses the common foundational resources:

### Deployments

- frontend Deployment runs the frontend container
- backend Deployment runs the API container
- Postgres Deployment runs the database container

### Services

- frontend Service exposes the frontend inside the cluster
- backend Service exposes the backend inside the cluster
- postgres Service exposes the database inside the cluster

### ConfigMaps

- frontend Nginx ConfigMap injects the Nginx runtime config
- Postgres init ConfigMap injects the SQL that creates tables and seeds products

### Secrets

- Postgres Secret provides DB user, password, and DB name
- the backend reads those values and builds its `DATABASE_URL`

Important security note:

- committed Kubernetes Secret manifests in this repo should be treated as local/demo-only and not production-safe
- a better shared-repo pattern is to keep `secret.example.yml` in Git and ignore real `secret.yml` files locally

### Ingress

- application Ingress routes `/` to the frontend and `/api` to the backend
- monitoring Ingress exposes Grafana and Prometheus under local hostnames

## How Traffic Flows From Browser to Frontend to Backend to Database

In Kubernetes, the traffic path is:

1. browser requests `http://anxiousphonestore.local`
2. Ingress receives the request
3. `/` is routed to the frontend Service
4. the frontend serves HTML, JS, CSS, and later calls `/api`
5. `/api` is routed by Ingress to the backend Service
6. backend queries Postgres through `postgres-service:5432`
7. backend returns JSON response to the frontend
8. frontend updates the UI

In production Compose, Nginx takes over the reverse-proxy role that Ingress handles in Kubernetes.

## How `/api` Routing Works

The repo uses different `/api` routing strategies depending on the environment:

### Local frontend development

- Vite dev server proxies `/api` to the backend target configured in [`frontend/vite.config.js`](../frontend/vite.config.js)

### Compose production

- Nginx proxies `/api/` to `http://backend:5000`

### Kubernetes

- Ingress routes `/api` requests to the backend Service

This is a useful DevOps learning point because API routing can be handled at different layers depending on the environment.

## How Postgres Is Initialized and Seeded

In Docker Compose production, Postgres uses [`infra/docker/init.sql`](../infra/docker/init.sql).

In Kubernetes, Postgres uses [`infra/k8s/postgres/postgres-init-configmap.yml`](../infra/k8s/postgres/postgres-init-configmap.yml).

Both define:

- `products`
- `orders`
- `order_items`

and seed the product catalog.

One of the most important operational details is that Postgres initialization SQL only runs on a fresh data directory. If a persistent volume or Docker volume already contains data, changing the init SQL file will not automatically re-run those statements.

## How Order Creation Works From UI to Database

The order flow looks like this:

1. the user adds products to the cart in the frontend
2. the frontend stores cart state locally
3. the user fills out checkout details
4. the frontend sends `POST /api/orders`
5. the backend validates customer fields and cart items
6. the backend starts a SQL transaction
7. the backend locks the relevant product rows
8. the backend checks stock
9. the backend inserts into `orders`
10. the backend inserts matching rows into `order_items`
11. the backend decrements product stock
12. the transaction commits

This is a strong example of why the middle tier exists: the frontend should not be trusted to create database rows directly.

## How Prometheus and Grafana Monitoring Works

The backend exposes Prometheus metrics at `/metrics`.

The repo includes:

- a `ServiceMonitor` that tells a Prometheus Operator-managed stack how to scrape the backend
- a monitoring ingress that exposes Grafana and Prometheus through local hostnames

What the repo does not include is the full Prometheus/Grafana installation itself. The manifests under [`infra/k8s/monitoring/`](../infra/k8s/monitoring) are lightweight integration resources, and the monitoring stack may need to be installed separately depending on the cluster setup.

## What Metrics Are Being Collected

Current metrics include:

- default Node.js and process metrics from `prom-client`
- `phone_store_http_requests_total`
- `phone_store_http_request_duration_seconds`

These metrics give visibility into request counts and request latency, which is enough to demonstrate the observability pipeline in a learning project.

## How CI/CD Workflows Support the Project

The GitHub Actions workflows support the project in stages:

### Pull request checks

- lint frontend
- lint backend
- ensure `version.txt` is updated when app/deployment files change

### Main branch automation

- build and push frontend/backend Docker images
- use `version.txt` as part of image tagging
- trigger Ansible-based Compose deployment
- run post-deploy verification checks

This gives the repo a full lifecycle story: develop, validate, version, package, deploy, verify.

## Problems Encountered and How They Were Solved

Examples of common issues in this project type:

- frontend image updated but browser still showed old UI
  - solved by checking image tags, rollout status, cache, and pull policy
- backend could not connect to Postgres
  - solved by verifying service names, DB name, and secret values
- `/api/orders` returned an error through Nginx
  - solved by checking whether the proxy layer correctly allowed POST requests to `/api`
- database changes in `init.sql` seemed ignored
  - solved by recognizing that Postgres init SQL only runs on a fresh database
- ingress hostnames did not resolve
  - solved by running `minikube tunnel` and updating `/etc/hosts`

## What Each Major DevOps Tool Contributes

### Docker

- packages the application into repeatable images

### Docker Compose

- runs the multi-service stack locally and on a VM

### Kubernetes

- orchestrates the services declaratively with Deployments, Services, and Ingress

### Helm

- makes the Kubernetes deployment more reusable and parameterized

### GitHub Actions

- automates linting, image publishing, deployment, and version checks

### Ansible

- deploys the Compose stack to a remote host

### Terraform

- provisions the VM and related AWS resources

### Prometheus/Grafana

- provides a simple observability story for request metrics and system health

## How To Explain This Project In an Interview

A clear way to explain it:

> This is a 3-tier e-commerce demo where I used a small full-stack app to practice real DevOps workflows. I containerized the frontend and backend, managed local development with Docker Compose, deployed the application both through raw Kubernetes manifests and a Helm chart, exposed Prometheus metrics, and added GitHub Actions for linting, image publishing, deployment verification, and version discipline. The value of the project is that it shows not just how to write the app, but how to operate and evolve it across environments.

You can then tailor the follow-up:

- if the interviewer asks about Kubernetes, talk about Deployments, Services, Ingress, ConfigMaps, and Secrets
- if they ask about CI/CD, explain the workflow chain and `version.txt`
- if they ask about operations, explain metrics, readiness checks, and troubleshooting

## Future Improvements

Useful next steps for turning this into a more production-grade platform include:

- migrating the chart into a more complete Helm release workflow
- introducing Argo CD for GitOps deployment
- moving from local Kubernetes/Minikube to AWS EKS
- enabling HTTPS with a real certificate flow
- replacing committed demo secrets with external secret management
- adding persistent volumes for Kubernetes Postgres data
- improving monitoring with dashboards, alerts, recording rules, and logs
- adding deeper test coverage in CI

## Final Presentation Framing

If you present this project well, the strongest point is not that it is a shop app. The strongest point is that one application is used to demonstrate:

- local development
- containerization
- versioned builds
- infrastructure automation
- deployment automation
- Kubernetes orchestration
- observability
- troubleshooting discipline

That makes it a strong DevOps learning project because the app is simple enough to understand, but the platform around it is broad enough to talk through in detail.
