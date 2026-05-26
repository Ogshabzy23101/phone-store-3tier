# Helm Chart

This folder contains the Helm chart for deploying the phone store application to Kubernetes using templated manifests.

## What The Chart Is For

The chart packages the main Kubernetes resources for:

- frontend
- backend
- PostgreSQL
- ingress
- supporting ConfigMap, Secret, and RBAC resources

It is useful when you want a more parameterized deployment workflow than applying raw manifests one by one.

The repository still keeps the raw Kubernetes manifests in [`infra/k8s/`](../infra/k8s) for learning and comparison. That is intentional: the raw manifests help explain the underlying Kubernetes resources, while the Helm chart shows how those same resources can be templated and reused.

## What This Folder Contains

- `Chart.yaml`
  - chart metadata such as chart name, chart version, and app version
- `values.yaml`
  - default values used by the templates
- `templates/`
  - Kubernetes resource templates for frontend, backend, Postgres, ingress, RBAC, ConfigMaps, and Secrets
- `files/init.sql`
  - SQL file packaged with the chart for Postgres initialization
- `.helmignore`
  - files Helm should exclude when packaging the chart

## How It Fits Into The Project

This chart represents the templated Kubernetes deployment path for the application.

It complements, rather than replaces, the raw manifests:

- use `infra/k8s/` when you want to learn each resource directly
- use `phone-store/` when you want a more reusable Helm-based workflow

## Important Commands

Render templates locally:

```bash
helm template phone-store ./phone-store
```

Lint the chart:

```bash
helm lint ./phone-store
```

Install the chart:

```bash
helm install phone-store ./phone-store
```

Upgrade an existing release:

```bash
helm upgrade phone-store ./phone-store
```

Install or upgrade in one command:

```bash
helm upgrade --install phone-store ./phone-store
```

Uninstall the release:

```bash
helm uninstall phone-store
```

Override values at runtime:

```bash
helm upgrade --install phone-store ./phone-store --set frontend.image.tag=v3.2
```

## Common Mistakes

- assuming Helm will fix a cluster that is missing prerequisites such as ingress or a monitoring stack
- forgetting to inspect rendered manifests with `helm template`
- mixing Helm-managed resources with manually applied raw manifests in the same namespace without a plan

## Monitoring Note

The Helm chart focuses on the application stack. Monitoring integration resources live in [`infra/k8s/monitoring/`](../infra/k8s/monitoring), and the Prometheus/Grafana stack itself may need to be installed separately depending on your cluster setup.

## Security Notes

- any Secret templates or values in this repo should be treated as local/demo-only
- committed Kubernetes Secret manifests are not production-safe
- prefer a `secret.example.yml` pattern in Git and keep real `secret.yml` files ignored locally
- for production, use a proper secret-management solution such as AWS Secrets Manager, External Secrets Operator, Sealed Secrets, or SOPS
