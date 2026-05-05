# Infrastructure

This folder contains the infrastructure and deployment material for the phone store project.

## What This Folder Contains

- `docker/`
  - Docker Compose files and database init SQL
- `k8s/`
  - raw Kubernetes manifests for frontend, backend, Postgres, ingress, and monitoring
- `ansible/`
  - playbooks for remote Compose deployment
- `terraform/`
  - AWS infrastructure provisioning

## How It Fits Into the Project

This folder is where the DevOps learning value of the repository lives. The application can be:

- developed locally with Docker Compose
- deployed to a VM using Ansible + Compose
- run on Kubernetes using raw manifests

There is also a Helm chart outside this folder at [`phone-store/`](../phone-store) that provides a templated Kubernetes deployment path.

For Helm-specific usage, see [`phone-store/README.md`](../phone-store/README.md).

## Important Commands

Docker Compose dev:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

Docker Compose prod-style:

```bash
docker compose --env-file infra/docker/.env -f infra/docker/docker-compose.prod.yml up -d
```

Terraform:

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Ansible:

```bash
cd infra/ansible
ansible-playbook playbooks/setup_docker.yml
ansible-playbook playbooks/deploy_compose.yml -e "image_tag=$(cat ../../version.txt)"
```

## Common Mistakes

- applying Kubernetes resources in the wrong order and missing the Postgres Secret/ConfigMap
- expecting init SQL to re-run on an already initialized Postgres data directory
- mixing local and production image tags without updating `version.txt`

## Security Notes

- Terraform defaults, Ansible inventory, and Kubernetes secrets in this repo should be treated as demo material
- committed Kubernetes Secret manifests are local/demo-only and not production-safe
- keep real `secret.yml` files ignored locally and prefer a `secret.example.yml` pattern in Git
- use ignored local files or secret management tooling for any real deployment values
