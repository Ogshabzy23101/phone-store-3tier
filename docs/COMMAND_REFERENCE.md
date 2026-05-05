# Command Reference

This document collects useful commands for working with the phone-store-3tier repository.

## Git

Check status:

```bash
git status
```

See changed files:

```bash
git diff --stat
```

Create a commit:

```bash
git add -A
git commit -m "your message"
```

Push branch:

```bash
git push
```

Force-push rewritten commits safely:

```bash
git push --force-with-lease
```

## Docker

Build backend image:

```bash
docker build -t phone-store-backend ./backend
```

Build frontend production image:

```bash
docker build -t phone-store-frontend -f frontend/Dockerfile.prod ./frontend
```

List images:

```bash
docker images
```

Prune unused images:

```bash
docker image prune -a
```

## Docker Compose

Start development stack:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

Stop development stack:

```bash
docker compose -f infra/docker/docker-compose.dev.yml down
```

Stop and remove DB volume:

```bash
docker compose -f infra/docker/docker-compose.dev.yml down -v
```

Start production-style stack:

```bash
cd infra/docker
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

Show Compose services:

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
docker compose --env-file .env -f infra/docker/docker-compose.prod.yml ps
```

View logs:

```bash
docker compose -f infra/docker/docker-compose.dev.yml logs
docker compose -f infra/docker/docker-compose.dev.yml logs backend
```

## Kubernetes

See all resources:

```bash
kubectl get all
```

Apply all raw manifests manually:

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
```

Check rollout:

```bash
kubectl rollout status deployment/frontend-deployment
kubectl rollout status deployment/backend-deployment
kubectl rollout status deployment/postgres-deployment
```

Describe a failing pod:

```bash
kubectl describe pod <pod-name>
```

View logs:

```bash
kubectl logs deployment/backend-deployment
kubectl logs deployment/postgres-deployment
```

Restart a deployment:

```bash
kubectl rollout restart deployment/frontend-deployment
kubectl rollout restart deployment/backend-deployment
```

Set image tag:

```bash
kubectl set image deployment/backend-deployment backend=ogshabzy23101/phone-store-backend:$(cat version.txt)
kubectl set image deployment/frontend-deployment frontend=ogshabzy23101/phone-store-frontend:$(cat version.txt)
```

## Minikube

Start cluster:

```bash
minikube start
```

Enable ingress:

```bash
minikube addons enable ingress
```

Run tunnel:

```bash
minikube tunnel
```

Get cluster IP:

```bash
minikube ip
```

Open dashboard:

```bash
minikube dashboard
```

## Helm

Lint the chart:

```bash
helm lint ./phone-store
```

Render templates:

```bash
helm template phone-store ./phone-store
```

Install or upgrade:

```bash
helm upgrade --install phone-store ./phone-store
```

Show values:

```bash
helm show values ./phone-store
```

## PostgreSQL Checks

Connect inside a running Postgres container:

```bash
docker exec -it phonestore_db psql -U phonestore_admin -d phonestore_db
```

List tables:

```bash
\dt
```

Check product seed count:

```sql
SELECT COUNT(*) FROM products;
```

Check orders:

```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

Kubernetes exec into Postgres:

```bash
kubectl exec -it <postgres-pod> -- psql -U phonestore_admin -d phonestore_db
```

## Prometheus and Grafana Checks

Check backend metrics locally:

```bash
curl http://localhost:5000/metrics
```

Inspect ServiceMonitor:

```bash
kubectl get servicemonitor
kubectl describe servicemonitor backend-monitor
```

Check monitoring ingress:

```bash
kubectl get ingress
kubectl describe ingress monitoring-ingress
```

Test local monitoring hostnames:

```bash
curl http://grafana.local
curl http://prometheus.local
```

## Troubleshooting Commands

Check all pods:

```bash
kubectl get pods -A
```

Watch events:

```bash
kubectl get events --sort-by=.metadata.creationTimestamp
```

Check ingress:

```bash
kubectl get ingress
kubectl describe ingress phone-store-ingress
```

Check service endpoints:

```bash
kubectl get svc
kubectl get endpoints
```

Check Compose health:

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
docker inspect phonestore_backend
```

Check version discipline:

```bash
cat version.txt
git diff --name-only
```
