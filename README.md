# Phone Store 3-Tier Application

This repository contains a small full-stack phone store application used to demonstrate a 3-tier architecture and a practical DevOps workflow.

The stack is split into:

- `frontend`: React + Vite UI
- `backend`: Express API
- `db`: PostgreSQL database
- `infra`: Docker, Ansible, and Terraform for packaging and deployment

The project supports both local development with Docker Compose and infrastructure-driven deployment to AWS.

## Architecture

At runtime, the system is composed of three application tiers:

1. Presentation tier: React frontend served by Vite in development and Nginx in production
2. Application tier: Express API exposing product and health endpoints
3. Data tier: PostgreSQL storing product catalog data

Production traffic flows through the frontend container on port `80`. Nginx serves the built frontend and proxies `/api`, `/health`, and `/ready` requests to the backend service. The backend connects to PostgreSQL through `DATABASE_URL`.

## Repository Structure

```text
.
├── backend/                # Express API and Docker image for the service tier
├── frontend/               # React application and frontend container definitions
├── infra/
│   ├── ansible/            # Server bootstrap and Compose deployment playbooks
│   ├── docker/             # Local and production docker-compose files + DB seed SQL
│   └── terraform/          # AWS EC2 and security group provisioning
└── version.txt             # Optional image/app version marker
```

## Features

- Product listing UI for seeded phone inventory
- Backend API endpoint for fetching products from PostgreSQL
- Health and readiness endpoints for service monitoring
- Local multi-container development environment
- Production Compose deployment using prebuilt images
- Infrastructure provisioning with Terraform
- Server configuration and deployment automation with Ansible

## Tech Stack

### Frontend

- React `19`
- Vite
- Nginx for production static serving and reverse proxying

### Backend

- Node.js `20`
- Express
- `pg` PostgreSQL client
- CORS and dotenv support

### Infrastructure

- Docker and Docker Compose
- PostgreSQL `15`
- Terraform
- Ansible
- AWS EC2

## Application Endpoints

### User-facing

- Frontend app: `http://localhost:5173` in development
- Frontend app: `http://localhost` in production-style Compose

### API

- `GET /api/products`: returns the products table
- `GET /health`: liveness check for the backend
- `GET /ready`: readiness check that verifies database connectivity

## Data Model

The database is initialized from [`infra/docker/init.sql`](infra/docker/init.sql).

Current seeded table:

- `products`
  - `id`
  - `name`
  - `brand`
  - `price_gbp`
  - `image_url`

Seed data currently includes:

- iPhone 15
- Galaxy S24
- Pixel 8

## Local Development

### Prerequisites

Install the following locally:

- Docker
- Docker Compose v2

Optional if you want to run services outside containers:

- Node.js `20`
- npm

### Run the Full Stack with Docker Compose

From the repository root:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

This starts:

- PostgreSQL database
- Express backend on internal port `5000`
- React frontend on `http://localhost:5173`

The frontend container mounts the local `frontend/` directory for an efficient development loop.

### Stop the Development Stack

```bash
docker compose -f infra/docker/docker-compose.dev.yml down
```

### Development Environment Notes

- The frontend is configured with `VITE_API_BASE_URL=http://backend:5000` in Docker development mode.
- The backend connects to the database using the Compose service name `db`.
- The development database uses a named Docker volume: `phonestore_db_data`.

## Running Services Without Docker

If you want to run the frontend and backend directly on your machine, install dependencies first.

### Backend

```bash
cd backend
npm ci
DATABASE_URL=postgres://phonestore_admin:phonestore_password@localhost:5432/phonestore_db PORT=5000 npm run dev
```

Available backend scripts:

- `npm run dev`
- `npm start`
- `npm run lint`

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Available frontend scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

If you run the frontend outside Docker, make sure API requests resolve correctly. The current frontend fetches `/api/products`, so you will typically want a reverse proxy or matching local routing behavior.

## Production Docker Deployment

The production Compose definition is [`infra/docker/docker-compose.prod.yml`](infra/docker/docker-compose.prod.yml).

It expects prebuilt and published images:

- `ogshabzy23101/phone-store-backend:${IMAGE_TAG}`
- `ogshabzy23101/phone-store-frontend:${IMAGE_TAG}`

### Production Services

- `db`: PostgreSQL with persistent volume and SQL initialization
- `backend`: Express API with readiness probe
- `frontend`: Nginx serving the built React app on port `80`

### Required Environment Variables

The production deployment uses an `.env` file with:

```env
POSTGRES_USER=phonestore_admin
POSTGRES_PASSWORD=phonestore_password
POSTGRES_DB=phonestore_db
IMAGE_TAG=<image-version>
```

Note: the current Compose file hardcodes some database values directly as well. For a real production environment, move all secrets and environment-specific values out of source-controlled manifests.

### Run Production Compose Locally

```bash
cd infra/docker
IMAGE_TAG=latest docker compose --env-file .env -f docker-compose.prod.yml up -d
```

You need a valid `.env` file and accessible container images for this to work.

## Terraform Infrastructure

Terraform configuration lives in [`infra/terraform`](infra/terraform).

### What It Provisions

- An AWS EC2 instance
- A security group allowing:
  - SSH on `22`
  - HTTP on `80`
- An Elastic IP for the instance

### Defaults

- AWS region: `eu-west-2`
- Instance type: `t3.micro`
- Default VPC usage

### Typical Terraform Workflow

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

The Terraform output exposes the instance public IP.

Before running it, verify:

- Your AWS profile name matches the provider configuration
- The AMI is valid for your account and region
- The EC2 key pair already exists

## Ansible Deployment

Ansible automation lives in [`infra/ansible`](infra/ansible).

### Playbooks

- [`setup_docker.yml`](infra/ansible/playbooks/setup_docker.yml): installs Docker, installs the Docker Compose v2 plugin, enables the Docker service, and prepares the target directory
- [`deploy_compose.yml`](infra/ansible/playbooks/deploy_compose.yml): copies the production Compose manifest, writes the deployment `.env`, pulls tagged images, and starts the stack

### Inventory

The inventory is defined in [`infra/ansible/inventory/hosts.ini`](infra/ansible/inventory/hosts.ini).

Update it to reflect the correct target host, SSH user, and private key path for your environment.

### Typical Ansible Workflow

```bash
cd infra/ansible
ansible-playbook playbooks/setup_docker.yml
ansible-playbook playbooks/deploy_compose.yml -e "image_tag=latest"
```

## Health Checks and Operations

Current health behavior:

- Development backend health check uses `/health`
- Production backend health check uses `/ready`
- Frontend depends on backend health before starting in Compose
- Database readiness is checked with `pg_isready`

Useful operational checks:

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
docker compose -f infra/docker/docker-compose.dev.yml logs
curl http://localhost:5000/health
curl http://localhost:5000/ready
```

## CI/CD Intent

This repository is structured for a workflow where:

1. Application images are built and tagged
2. Tagged images are pushed to a registry
3. Ansible deploys the exact image tag to the target host
4. Docker Compose updates the running services

The `IMAGE_TAG` variable in production Compose is the handoff point between build and deployment.

## Known Gaps and Improvement Areas

- Secrets are currently embedded or duplicated in deployment configuration
- Terraform values are mostly fixed defaults instead of environment-driven inputs
- The frontend README is still the default Vite template and could be cleaned up
- No automated test suite is included yet
- No CI pipeline definition is present in this repository
- Inventory currently stores a concrete host entry rather than using a more flexible environment approach

## Troubleshooting

### Frontend loads but products do not appear

Check:

- backend container is healthy
- `/api/products` is reachable
- database container is healthy
- `products` table has been initialized

### Backend is not ready

Check:

- `DATABASE_URL` is correct
- PostgreSQL is running
- the database has accepted connections

### Production deployment fails to start

Check:

- `IMAGE_TAG` points to images that actually exist in the registry
- the server can pull from the image registry
- Docker Compose validation succeeds on the target host

## Useful Commands

```bash
# Development stack
docker compose -f infra/docker/docker-compose.dev.yml up --build
docker compose -f infra/docker/docker-compose.dev.yml down

# Backend
cd backend && npm ci && npm run dev

# Frontend
cd frontend && npm ci && npm run dev

# Terraform
cd infra/terraform && terraform init && terraform plan

# Ansible
cd infra/ansible && ansible-playbook playbooks/setup_docker.yml
cd infra/ansible && ansible-playbook playbooks/deploy_compose.yml -e "image_tag=latest"
```

## License

No license file is currently included in this repository. Add one if you intend to distribute or open-source the project.
