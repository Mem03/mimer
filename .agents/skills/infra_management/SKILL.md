---
name: Infrastructure Management
description: Rules for managing and modifying the Terraform and Kubernetes infrastructure in the Mimer platform.
---

# Infrastructure Management Skill

This skill is invoked when modifying the underlying infrastructure definitions in the `infra/` folder.

## Capabilities & Best Practices

### Modifying Terraform State
* **Never use text modifications on `.tfstate` files.**
* All changes to infrastructure must be made in the `.tf` files (`minio.tf`, `spark.tf`, `jupyter.tf`).

### Running Commands safely
When the user asks you to apply an infrastructure change:
1. Always run `terraform plan` first and show the user the output.
2. Only run `terraform apply` if the user explicitly confirms the plan is correct.
3. Be aware that the state is local to the machine, not remote.

### Helm Provider specific rules
The cluster provisions its software heavily via the Terraform Helm provider:
* E.g., Jupyter and MinIO are Helm charts defined in `.tf` resources.
* When upgrading versions, modify the `version` field inside the Terraform `helm_release` blocks rather than trying to run `helm upgrade` manually on the CLI. The `make up` command orchestrates the `terraform apply`.
