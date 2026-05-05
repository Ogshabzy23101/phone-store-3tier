# Kubernetes Postgres Resources

This folder contains the Kubernetes manifests for the Postgres database tier.

## What This Folder Contains

- `postgres-deployment.yml`
  - runs the Postgres container
- `postgres-service.yml`
  - exposes Postgres to the backend inside the cluster
- `postgres-init-configmap.yml`
  - provides the initialization SQL used at first database startup
- `secret.yml`
  - demo Secret manifest for database credentials

## How It Fits Into the Project

This folder is responsible for database bootstrap in the Kubernetes path. It creates:

- the products table
- the orders table
- the order_items table
- the seeded catalog used by the storefront demo

The backend depends on these resources being ready before order and catalog flows work correctly.

## Important Commands

Apply Postgres resources:

```bash
kubectl apply -f infra/k8s/postgres/secret.yml
kubectl apply -f infra/k8s/postgres/postgres-init-configmap.yml
kubectl apply -f infra/k8s/postgres/postgres-deployment.yml
kubectl apply -f infra/k8s/postgres/postgres-service.yml
```

Inspect DB startup:

```bash
kubectl logs deployment/postgres-deployment
kubectl describe pod <postgres-pod-name>
kubectl exec -it <postgres-pod-name> -- psql -U phonestore_admin -d phonestore_db -c '\dt'
```

## Common Mistakes

- changing the init SQL and expecting it to re-run on an already initialized database
- using the wrong DB name in the Secret or backend environment
- forgetting that ConfigMap-based init SQL is mounted only for Postgres bootstrap

## Security Notes

- the committed Secret manifest in this folder should be treated as local/demo-only and not production-safe
- do not commit real credential values in a shared environment
- prefer `secret.example.yml` for templates and keep real `secret.yml` files ignored locally
- future production options include AWS Secrets Manager, External Secrets Operator, Sealed Secrets, or SOPS
