# GitHub Actions Workflows

This folder contains the CI/CD workflows used by the repository.

## What This Folder Contains

- `ci.yml`
  - installs frontend and backend dependencies
  - runs lint checks on pull requests to `main`
- `version_bump.yml`
  - enforces `version.txt` updates when app or deployment files change
- `build_push_image.yml`
  - builds and pushes frontend and backend Docker images on pushes to `main`
- `pull_deploy_compose.yml`
  - runs Ansible-based deployment after a successful image build workflow
- `deploy_verification.yml`
  - verifies that the deployed application is reachable and returns seeded data

## How It Fits Into the Project

These workflows create a simple but realistic CI/CD chain:

1. open a PR
2. lint checks run
3. version bump rules run
4. merge to `main`
5. images are built and pushed
6. Compose deployment is triggered
7. deployment is verified

## Required Repository Secrets

Examples used by the workflows include:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `EC2_SSH_KEY`
- `EC2_HOST`
- `EC2_USER`

## Common Mistakes

- forgetting to update `version.txt` when app or deployment files change
- pushing to `main` without valid Docker Hub credentials configured
- deployment verification failing because the target host is up but the service is not yet ready

## Security Notes

- never print secrets into workflow logs
- keep deployment SSH keys and registry credentials in GitHub Secrets
- do not hardcode real hosts, passwords, or keys inside workflow files
- if Kubernetes Secret manifests are used for local/demo environments, keep production secret files out of Git and prefer `secret.example.yml` templates plus ignored local `secret.yml` files
