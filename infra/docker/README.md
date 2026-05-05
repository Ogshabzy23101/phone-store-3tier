# Docker and Compose

This folder contains the Docker Compose definitions and SQL bootstrap used by the project.

## What This Folder Contains

- `docker-compose.dev.yml`
  - development stack for Postgres, backend, and frontend
- `docker-compose.prod.yml`
  - production-style stack that expects published images and an `.env` file
- `init.sql`
  - schema creation and product seed data for Postgres initialization

## How It Fits Into the Project

This folder supports two important workflows:

- local full-stack development
- VM-based deployment using Compose and Ansible

## Important Commands

Development stack:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
docker compose -f infra/docker/docker-compose.dev.yml down
```

Production-style stack:

```bash
cd infra/docker
docker compose --env-file .env -f docker-compose.prod.yml up -d
docker compose --env-file .env -f docker-compose.prod.yml ps
docker compose --env-file .env -f docker-compose.prod.yml logs
```

Reset the database volume if you need `init.sql` to run again:

```bash
docker compose -f infra/docker/docker-compose.dev.yml down -v
```

## Common Mistakes

- changing `init.sql` and expecting Postgres to pick it up on an existing volume
- forgetting to provide `IMAGE_TAG` for the production Compose file
- using published image tags that do not exist in Docker Hub yet

## Security Notes

- do not commit real `.env` files with production credentials
- keep Compose `.env` files local or inject them through deployment tooling
