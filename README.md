# phone-store-3tier

`phone-store-3tier` is a DevOps learning project built around a small 3-tier e-commerce application. The goal of the repository is not only to run a React frontend, a Node.js API, and a PostgreSQL database, but also to show how the same application can be packaged, versioned, deployed, observed, and verified across multiple environments.

The project includes:

- a React/Vite frontend served by Nginx in production
- a Node.js/Express backend API
- a PostgreSQL database seeded with products and order tables
- Docker and Docker Compose for local and Compose-based production workflows
- raw Kubernetes manifests for frontend, backend, Postgres, ingress, secrets, and monitoring resources
- a Helm chart for templated Kubernetes deployment
- GitHub Actions workflows for linting, image publishing, deployment orchestration, and version checks
- Prometheus metrics exposure and Grafana/Prometheus ingress integration

## Project Goals

This repository is designed as a portfolio-style DevOps project with practical learning goals:

- understand 3-tier application structure
- containerize frontend and backend services
- manage local multi-service development with Docker Compose
- deploy the stack with Kubernetes manifests and a Helm chart
- introduce observability using Prometheus metrics and ServiceMonitor integration
- automate build, publish, verification, and versioning workflows with GitHub Actions

## Architecture Overview

The application follows a standard 3-tier pattern:

1. Presentation tier
   - React/Vite frontend
   - served by Vite during development
   - served by Nginx in production containers and Kubernetes
2. Application tier
   - Express API
   - exposes product, order, health, readiness, and metrics endpoints
3. Data tier
   - PostgreSQL
   - stores products, orders, and order_items

### Runtime traffic flow

- In local Docker development, the frontend talks to the backend through Vite proxying `/api` to the backend container.
- In production Compose, Nginx serves the frontend and proxies `/api`, `/health`, and `/ready` to the backend container.
- In Kubernetes, Ingress routes `/` to the frontend Service and `/api` to the backend Service.
- The backend talks to Postgres using either `DATABASE_URL` or separate `DB_*` environment variables.

## Technology Stack

### Application

- React 19
- Vite
- Nginx
- Node.js 20
- Express
- PostgreSQL 15

### DevOps and Platform

- Docker
- Docker Compose
- Kubernetes manifests
- Helm
- GitHub Actions
- Ansible
- Terraform
- AWS EC2
- Prometheus Operator ServiceMonitor integration
- Grafana and Prometheus ingress exposure

## Repository Structure

```text
.
├── backend/                  # Express API, metrics, Docker image
├── frontend/                 # React app, Vite config, Nginx production config
├── infra/
│   ├── ansible/              # Compose-based deployment automation
│   ├── docker/               # Compose files and SQL seed/init
│   ├── k8s/                  # Raw Kubernetes manifests
│   └── terraform/            # AWS infrastructure provisioning
├── phone-store/              # Helm chart for Kubernetes deployment
├── script/                   # Helper deployment script(s)
├── docs/                     # Project-level walkthroughs and references
├── .github/workflows/        # CI/CD and version enforcement workflows
└── version.txt               # Application version used by image tagging/workflow discipline
```

## Key Features

- category-based product catalog for phones, laptops, and accessories
- product detail page
- cart and checkout flow
- order creation with `POST /api/orders`
- health, readiness, and Prometheus metrics endpoints
- Docker Compose workflows for development and production-style runtime
- Kubernetes raw manifest deployment path
- Helm chart deployment path
- version bump enforcement for app and deployment changes

## Local Development

### Prerequisites

Install the following tools locally:

- Node.js 20+
- npm
- Docker
- Docker Compose v2
- kubectl
- Minikube if you want to run the Kubernetes path locally
- Helm if you want to use the chart in `phone-store/`

### Run frontend and backend directly

Backend:

```bash
cd backend
npm ci
DATABASE_URL=postgres://phonestore_admin:phonestore_password@localhost:5432/phonestore_db npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Notes:

- the frontend uses `/api` requests and relies on the Vite dev proxy in [`frontend/vite.config.js`](frontend/vite.config.js)
- local frontend development expects the backend to be reachable on `http://localhost:5000` unless `VITE_API_BASE_URL` is set

## Docker Compose Workflows

Documentation for Compose files lives in [`infra/docker/README.md`](infra/docker/README.md).

### Development Compose

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

What this does:

- starts Postgres
- builds the backend locally
- builds the frontend dev container
- mounts the frontend source for an iterative development loop

Expected entry points:

- frontend: `http://localhost:5173`
- backend health: `http://localhost:5000/health` from inside the network

### Production-style Compose

```bash
cd infra/docker
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

What this does:

- pulls prebuilt frontend and backend images using `IMAGE_TAG`
- mounts [`infra/docker/init.sql`](infra/docker/init.sql) into Postgres initialization
- exposes the frontend/Nginx container on port `80`

Important note:

- Postgres initialization SQL in Docker only runs on a fresh data directory or fresh volume

## Kubernetes Deployment

Documentation for Kubernetes manifests lives in:

- [`infra/k8s/README.md`](infra/k8s/README.md)
- [`infra/k8s/frontend/README.md`](infra/k8s/frontend/README.md)
- [`infra/k8s/backend/README.md`](infra/k8s/backend/README.md)
- [`infra/k8s/postgres/README.md`](infra/k8s/postgres/README.md)

### Raw manifest path

Typical apply order:

```bash
kubectl apply -f infra/k8s/postgres/secret.yml
kubectl apply -f infra/k8s/postgres/postgres-init-configmap.yml
kubectl apply -f infra/k8s/postgres/postgres-deployment.yml
kubectl apply -f infra/k8s/postgres/postgres-service.yml

kubectl apply -f infra/k8s/backend/backend-sa.yml
kubectl apply -f infra/k8s/backend/backend-role.yml
kubectl apply -f infra/k8s/backend/role-binding.yml
kubectl apply -f infra/k8s/backend/backend-deployment.yml
kubectl apply -f infra/k8s/backend/backend-service.yml

kubectl apply -f infra/k8s/frontend/frontend-nginx-configmap.yml
kubectl apply -f infra/k8s/frontend/frontend-deployment.yml
kubectl apply -f infra/k8s/frontend/frontend-service.yml

kubectl apply -f infra/k8s/ingress.yml
kubectl apply -f infra/k8s/monitoring/backend-servicemonitor.yml
kubectl apply -f infra/k8s/monitoring/monitoring-ingress.yml
```

### Minikube notes

If you are using Minikube:

```bash
minikube addons enable ingress
minikube tunnel
```

Then map hosts locally:

- `anxiousphonestore.local`
- `grafana.local`
- `prometheus.local`

to the Minikube ingress IP in `/etc/hosts`.

### Helm path

This repo also includes a Helm chart in [`phone-store/`](phone-store).

Example usage:

```bash
helm upgrade --install phone-store ./phone-store
```

Helm is relevant here as a learning step toward template-driven deployments, even though raw manifests are also kept in the repository for learning and comparison.

## Environment Variables and Secret Handling

### Backend runtime variables

The backend supports:

- `DATABASE_URL`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `PORT`

### Frontend development variable

- `VITE_API_BASE_URL`

### Secret handling guidance

This repository is a learning project, but the security expectation should still be clear:

- committed Kubernetes Secret manifests in this repo should be treated as local/demo-only and not production-safe
- real `secret.yml` files should not be committed to shared repositories
- keep example templates such as `secret.example.yml` under version control instead of live credentials
- add real secret manifests to `.gitignore` and keep them local
- prefer environment injection or secret stores instead of plain-text manifests for anything beyond local/demo use

Future production-grade options include:

- AWS Secrets Manager
- External Secrets Operator
- Bitnami Sealed Secrets
- Mozilla SOPS

Important caveat for this repo:

- [`infra/k8s/postgres/secret.yml`](infra/k8s/postgres/secret.yml) currently exists as part of the learning setup and should be treated as a local/demo placeholder, not a production pattern

## CI/CD Overview

Workflow documentation lives in [` .github/workflows/README.md`](.github/workflows/README.md).

Current GitHub Actions workflows:

- `ci.yml`
  - installs frontend and backend dependencies
  - runs lint checks on pull requests
- `version_bump.yml`
  - checks whether app/deployment changes also updated `version.txt`
- `build_push_image.yml`
  - builds and pushes backend and frontend images on pushes to `main`
- `pull_deploy_compose.yml`
  - triggers an Ansible deployment after successful image publishing
- `deploy_verification.yml`
  - verifies frontend reachability, backend readiness, and basic product flow after deployment

### Versioning with `version.txt`

[`version.txt`](version.txt) acts as the human-controlled application version source for:

- Docker image tags in CI
- downstream deployment workflows
- repository discipline for app/deployment changes

If you change:

- `frontend/`
- `backend/`
- `infra/docker/`
- `infra/k8s/`

the `version_bump.yml` workflow expects `version.txt` to change too.

## Observability and Monitoring

The backend exposes:

- `/health`
- `/ready`
- `/metrics`

Metrics are implemented in the backend with Prometheus client instrumentation and currently include:

- default Node.js/process metrics
- `phone_store_http_requests_total`
- `phone_store_http_request_duration_seconds`

Kubernetes monitoring resources include:

- [`infra/k8s/monitoring/backend-servicemonitor.yml`](infra/k8s/monitoring/backend-servicemonitor.yml)
- [`infra/k8s/monitoring/monitoring-ingress.yml`](infra/k8s/monitoring/monitoring-ingress.yml)

Important note:

- [`infra/k8s/monitoring/`](infra/k8s/monitoring) contains lightweight integration resources for monitoring
- the repo does not contain the full Prometheus/Grafana installation manifests
- depending on your cluster setup, the monitoring stack may need to be installed separately

## Troubleshooting

See the full guide in [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

Common issues include:

- old UI still showing after image update
- `CrashLoopBackOff` from missing secrets or DB misconfiguration
- Postgres seed SQL not re-running on existing volumes
- ingress hosts not resolving because `/etc/hosts` or `minikube tunnel` is missing
- Nginx returning `405` for `/api/orders` when `/api` routing is not configured correctly
- version checks failing because `version.txt` was not bumped

## Future Improvements

- replace committed demo secrets with templated examples and secret managers
- store production database data on persistent volumes in Kubernetes
- use HTTPS and a real ingress/controller strategy for non-local environments
- package the raw manifest flow more cleanly through Helm values or Kustomize
- adopt Argo CD or another GitOps controller
- migrate the Kubernetes path to AWS EKS or another managed cluster
- expand monitoring with dashboards, alerts, and tracing
- add automated API and UI tests to CI

## Learning Outcomes

This project is useful for demonstrating:

- multi-tier application thinking
- Docker image build and runtime separation
- Compose-based local and remote deployment workflows
- Kubernetes building blocks such as Deployments, Services, ConfigMaps, Secrets, RBAC, and Ingress
- CI/CD chaining with GitHub Actions
- versioning discipline with lightweight repo automation
- observability concepts with Prometheus-style metrics exposure

## Related Documentation

- [`frontend/README.md`](frontend/README.md)
- [`backend/README.md`](backend/README.md)
- [`infra/README.md`](infra/README.md)
- [`phone-store/README.md`](phone-store/README.md)
- [`docs/PROJECT_WALKTHROUGH.md`](docs/PROJECT_WALKTHROUGH.md)
- [`docs/COMMAND_REFERENCE.md`](docs/COMMAND_REFERENCE.md)
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
