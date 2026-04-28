#!/usr/bin/env bash
set -euo pipefail

VERSION=$(cat version.txt)

echo "Deploying version: $VERSION"

kubectl set image deployment/backend-deployment \
backend=ogshabzy23101/phone-store-backend:$VERSION

kubectl set image deployment/frontend-deployment \
frontend=ogshabzy23101/phone-store-frontend:$VERSION

echo "Waiting for rollout..."

kubectl rollout status deployment/backend-deployment
kubectl rollout status deployment/frontend-deployment

echo "Deployment complete 🚀"