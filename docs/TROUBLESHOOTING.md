# Troubleshooting Guide

This guide collects common issues seen in the phone-store-3tier project and how to diagnose them.

## Old UI Showing After Image Update

### Symptoms

- the browser still shows an older frontend
- Kubernetes rollout completed but the page looks unchanged

### Checks

- verify the deployed image tag
- hard-refresh the browser
- check `imagePullPolicy`
- confirm the rollout actually replaced old pods

### Fix

```bash
kubectl rollout restart deployment/frontend-deployment
kubectl rollout status deployment/frontend-deployment
```

Also check that the image tag matches `version.txt`.

## Pod `CrashLoopBackOff`

### Symptoms

- backend or Postgres pod keeps restarting

### Checks

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
```

### Common causes

- missing or invalid Secret values
- wrong database hostname
- invalid environment variable wiring
- Postgres not ready yet

## Database Not Seeded

### Symptoms

- `/api/products` returns empty data
- expected catalog products are missing

### Checks

- confirm the init SQL contains the seed insert
- check Postgres logs
- query `products` directly

### Fix

Remember that Postgres init SQL only runs on a fresh database.

For Docker Compose:

```bash
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

For Kubernetes:

- recreate the Postgres data if you need initialization to run again
- or apply the seed data manually inside the database

## Wrong DB Name

### Symptoms

- backend readiness fails
- backend cannot connect to Postgres

### Checks

- compare `POSTGRES_DB` in the Secret or Compose env
- compare `DB_NAME` or `DATABASE_URL` in the backend environment

### Fix

Make sure both sides use the same database name, usually `phonestore_db`.

## Ingress Not Applied

### Symptoms

- app is healthy internally but not reachable through hostname

### Checks

```bash
kubectl get ingress
kubectl describe ingress phone-store-ingress
```

### Fix

- apply [`infra/k8s/ingress.yml`](../infra/k8s/ingress.yml)
- make sure the ingress controller is installed
- for Minikube, enable the ingress addon

## `minikube tunnel` Not Running

### Symptoms

- ingress exists but the hostname does not work

### Fix

```bash
minikube tunnel
```

Keep it running in a separate terminal while testing ingress-based access.

## `/etc/hosts` Issues

### Symptoms

- `anxiousphonestore.local`, `grafana.local`, or `prometheus.local` do not resolve

### Fix

Add the relevant ingress IP to `/etc/hosts`, for example:

```text
127.0.0.1 anxiousphonestore.local grafana.local prometheus.local
```

or map them to the Minikube ingress IP as appropriate for your setup.

## `405` Nginx Error for `/api/orders`

### Symptoms

- product browsing works but checkout fails with `405`

### Likely cause

The Nginx layer serving the frontend is not correctly proxying the `/api` path, or the request is being handled by the wrong Nginx config.

### Checks

- inspect [`frontend/nginx.conf`](../frontend/nginx.conf)
- inspect the Kubernetes frontend Nginx ConfigMap
- verify whether `/api` is routed by Nginx or by Ingress in that environment

## Backend Cannot Connect to Postgres

### Symptoms

- `/ready` returns failure
- backend logs show connection errors

### Checks

- DB host/service name
- DB name
- DB user/password
- whether Postgres is actually ready

### Helpful commands

```bash
kubectl logs deployment/backend-deployment
kubectl logs deployment/postgres-deployment
curl http://localhost:5000/ready
```

## `version.txt` Not Updated

### Symptoms

- pull request fails the version bump workflow

### Cause

You changed `frontend/`, `backend/`, `infra/docker/`, or `infra/k8s/` without updating [`version.txt`](../version.txt).

### Fix

Increment `version.txt` before pushing the branch.

## `imagePullPolicy` and `latest` Tag Behaviour

### Symptoms

- pods appear redeployed but still run old code

### Cause

Using `latest` or reusing tags can make it harder to reason about what image is actually running.

### Fix

- use versioned image tags
- align image tags with `version.txt`
- restart deployments when needed

## ConfigMap Changes Not Taking Effect

### Symptoms

- updated Nginx or init SQL ConfigMap but runtime behavior did not change

### Fix

For frontend Nginx:

```bash
kubectl rollout restart deployment/frontend-deployment
```

For Postgres init SQL:

- a ConfigMap change alone is not enough if the database has already initialized
- Postgres init scripts do not automatically re-run on existing data

## Postgres `init.sql` Only Runs on Fresh DB

### Symptoms

- schema or seed updates seem ignored

### Explanation

This is standard Postgres container behavior. Files in `/docker-entrypoint-initdb.d/` are only processed the first time the database directory is created.

### Fix

- recreate the volume/data for a clean bootstrap
- or apply the SQL changes manually to the existing database

## Monitoring Pages Not Reachable

### Symptoms

- `grafana.local` or `prometheus.local` do not load

### Checks

- monitoring ingress applied
- monitoring stack actually installed
- hostnames mapped locally

### Important note

This repo contains monitoring integration resources, not the full monitoring stack installation.

## Secret Manifest Safety

### Symptoms

- the repo contains a `secret.yml` and it is unclear whether it is safe for shared environments

### Guidance

- committed Kubernetes Secret manifests in this project should be treated as local/demo-only
- they are not production-safe
- keep a `secret.example.yml` template in Git
- keep real `secret.yml` files ignored locally

### Better future options

- AWS Secrets Manager
- External Secrets Operator
- Sealed Secrets
- SOPS
- tt