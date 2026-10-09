# Helm Chart

This folder contains the Helm chart for deploying the phone store application to Kubernetes using templated manifests.

## What The Chart Is For

The chart packages the main Kubernetes resources for:

- frontend
- backend
- PostgreSQL
- ingress
- supporting ConfigMap, Secret, and RBAC resources

It is useful for a more parameterized deployment workflow than applying raw manifests one by one.

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

- use `infra/k8s/` when i want to learn or inspect each resource directly
- use `phone-store/` when i want a more reusable Helm-based workflow

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

- The Helm `secret` template defines the structure of the Kubernetes Secret resource. It contains references to Helm values, but it does not contain the real credentials directly.

- Sensitive values such as the database username, password, and other credentials will be stored in a separate local values file, for example `values-secret.yaml`.

- The `values-secret.yaml` file will be passed to Helm at deployment time so that the sensitive values are injected into the Secret template when the chart is rendered.

- `values-secret.yaml` will be excluded from Git using `.gitignore` so that real credentials are never committed to the repository.

- This approach is suitable for this current learning environment. In a production environment, secrets will preferably be retrieved from a dedicated secret-management system such as AWS Secrets Manager, External Secrets Operator, SOPS, or Sealed Secrets.
