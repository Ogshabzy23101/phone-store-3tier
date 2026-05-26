# Kubernetes Manifests

This folder contains the raw Kubernetes manifests used to deploy the phone store stack without Helm.

## What This Folder Contains

- `frontend/`
  - frontend Deployment, Service, and Nginx ConfigMap
- `backend/`
  - backend Deployment, Service, ServiceAccount, Role, and RoleBinding
- `postgres/`
  - Postgres Deployment, Service, Secret, and init SQL ConfigMap
- `monitoring/`
  - ServiceMonitor and ingress resources for Grafana/Prometheus exposure
- `ingress.yml`
  - application ingress routing for frontend and backend

## How It Fits Into the Project

The manifests in this folder represent the direct Kubernetes deployment path for the application. They are useful for:

- learning the basic Kubernetes resource model
- running the app in Minikube or another learning cluster
- understanding the building blocks before moving to Helm or GitOps

## Suggested Apply Order

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

## Common Mistakes

- applying the backend before Postgres secret/service is ready
- forgetting `minikube tunnel` when testing ingress locally
- editing ConfigMaps and forgetting that a pod restart or rollout may be needed
- expecting `secret.yml` to be a production-safe pattern

## Security Notes

- committed Kubernetes Secret manifests in this repo are local/demo-only and not production-safe
- replace live secret manifests with `secret.example.yml` templates or generated secrets in real environments
- use `.gitignore` to prevent real secret files from being committed and keep real `secret.yml` files local
- consider Sealed Secrets, SOPS, External Secrets Operator, or AWS Secrets Manager for production
