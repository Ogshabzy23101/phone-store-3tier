# Kubernetes Backend Resources

This folder contains the Kubernetes manifests for the backend tier.

## What This Folder Contains

- `backend-deployment.yml`
  - runs the backend image and injects DB configuration
- `backend-service.yml`
  - exposes the backend Deployment inside the cluster
- `backend-sa.yml`
  - ServiceAccount for the backend pod
- `backend-role.yml`
  - Role resource for backend access needs
- `role-binding.yml`
  - binds the backend ServiceAccount to the Role

## How It Fits Into the Project

The backend is the application tier between the frontend and Postgres. In Kubernetes:

- Ingress sends `/api` traffic to `backend-service`
- the backend pod reads DB credentials from the Postgres Secret
- Prometheus can scrape metrics through the Service/ServiceMonitor path

## Important Commands

Apply backend resources:

```bash
kubectl apply -f infra/k8s/backend/backend-sa.yml
kubectl apply -f infra/k8s/backend/backend-role.yml
kubectl apply -f infra/k8s/backend/role-binding.yml
kubectl apply -f infra/k8s/backend/backend-deployment.yml
kubectl apply -f infra/k8s/backend/backend-service.yml
```

Check logs and readiness:

```bash
kubectl logs deployment/backend-deployment
kubectl describe pod <backend-pod-name>
kubectl port-forward svc/backend-service 5000:5000
curl http://localhost:5000/ready
curl http://localhost:5000/metrics
```

## Common Mistakes

- backend cannot connect to Postgres because the Secret values or DB service name are wrong
- `/api/orders` fails because the database schema was never initialized
- readiness passes in one environment but API routes fail in another because `/api` routing was only configured on one layer

## Security Notes

- backend credentials should come from Secrets, not hardcoded manifests
- avoid logging secret values when debugging failed deployments
