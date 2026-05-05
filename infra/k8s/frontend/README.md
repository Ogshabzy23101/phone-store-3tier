# Kubernetes Frontend Resources

This folder contains the Kubernetes manifests for the frontend tier.

## What This Folder Contains

- `frontend-deployment.yml`
  - runs the frontend container image
- `frontend-service.yml`
  - exposes the frontend Deployment internally in the cluster
- `frontend-nginx-configmap.yml`
  - provides the Nginx configuration mounted into the frontend container

## How It Fits Into the Project

The frontend is the entry point users hit from the browser. In the raw manifest path:

- Ingress sends `/` traffic to `frontend-service`
- the frontend pod serves the built React app using Nginx
- Nginx config determines how SPA routing and proxy behavior work

## Important Commands

Apply frontend resources:

```bash
kubectl apply -f infra/k8s/frontend/frontend-nginx-configmap.yml
kubectl apply -f infra/k8s/frontend/frontend-deployment.yml
kubectl apply -f infra/k8s/frontend/frontend-service.yml
```

Inspect rollout:

```bash
kubectl get deploy,pods,svc
kubectl rollout status deployment/frontend-deployment
kubectl describe deployment frontend-deployment
```

## Common Mistakes

- old UI still showing because the browser cached old assets or the cluster kept an older image
- ConfigMap changed but frontend pod never restarted
- Nginx config missing API proxy rules in environments where the frontend is expected to proxy to backend

## Security Notes

- frontend resources usually do not hold sensitive values directly
- do not inject secrets into client-side configuration unless they are safe to expose publicly
