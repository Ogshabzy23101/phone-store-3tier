# Docker and Compose
This folder contains the Docker Compose definitions and SQL bootstrap files used by the project.
---
# What This Folder Contains
## docker-compose.dev.yml
Development stack for:
- Postgres database
- Express backend API
- React frontend application
This file is mainly used for:
- local development
- testing containers together
- rebuilding services quickly during development
---
## docker-compose.prod.yml
Production-style stack that expects:
- published Docker images
- an `.env` file for runtime variables
- image tags from Docker Hub
This is the Compose file used by the EC2 + Ansible deployment workflow.
---
## init.sql
Initial database bootstrap script for Postgres.
This file:
- creates database tables
- inserts initial seed product data
The script only runs automatically when the Postgres data directory is empty.
---
# How Docker Compose Works in This Project
Docker Compose automatically creates:
- a shared Docker network
- DNS-based service discovery between containers
This means services can communicate using their Compose service names.
Example:
```env
DATABASE_URL=postgres://phonestore_admin:phonestore_password@db:5432/phonestore_db

Here:

* db is not a public hostname
* db is the Compose service name
* Docker automatically resolves db to the Postgres container IP address

Without Docker Compose, this networking would need to be configured manually using:

docker network create
docker run --network ...

⸻

Development Workflow

Start development stack:

docker compose -f infra/docker/docker-compose.dev.yml up --build

Stop development stack:

docker compose -f infra/docker/docker-compose.dev.yml down

Rebuild containers after code changes:

docker compose -f infra/docker/docker-compose.dev.yml up --build

⸻

Production-Style Workflow

Start production-style stack:

cd infra/docker
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d

Check running services:

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  ps

View logs:

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  logs

Pull latest published images:

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  pull

⸻

Database Reset

If you change init.sql, Postgres will NOT rerun it automatically on an existing volume.

To force initialization again:

docker compose -f infra/docker/docker-compose.dev.yml down -v

WARNING:

This deletes the Postgres volume and removes all existing database data.

⸻

Dev vs Production Compose

Development Compose

Uses:

* local source code
* live rebuilds
* locally built images

Main goal:

* developer productivity

⸻

Production Compose

Uses:

* published Docker Hub images
* immutable image tags
* environment variables from .env

Main goal:

* stable deployments

⸻

Common Mistakes

* changing init.sql and expecting Postgres to rerun it automatically
* forgetting to provide IMAGE_TAG
* pushing image tags that do not exist in Docker Hub
* using old cached images during deployment
* forgetting to run docker compose pull

⸻

Security Notes

* never commit real .env files
* never commit production secrets
* inject secrets through:
    * GitHub Actions secrets
    * Ansible variables
    * environment variables
    * secret managers

⸻

Relationship to Kubernetes

Docker Compose service discovery:

backend -> db

Kubernetes service discovery:

backend -> postgres-service

The architecture concept is similar:

application services communicate using internal service names instead of container IP addresses.