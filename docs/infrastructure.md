# Infrastructure & Compute Layer

This module provisions the underlying Kubernetes resources using Terraform and Helm. It creates the isolated environments needed for storage and compute.

## Components

The infrastructure consists of three main pillars, all running inside a local Minikube cluster:

* **Interactive Workspace (JupyterHub):** Provides a multi-user notebook environment. It is pre-configured with the `jupyter/pyspark-notebook` image to give you instant access to Python, Java, and S3 connectors.
* **Compute Engine (Apache Spark):** Uses the Kubeflow Spark Operator to natively manage Spark applications on Kubernetes. Jupyter is configured to talk directly to this operator via a dedicated Service Account (`spark-sa`).
* **Object Storage (MinIO):** A local, S3-compatible storage layer. It is configured to run in standalone mode with a minimal resource footprint (1 pod, low CPU/RAM) and automatically provisions a `raw-data` bucket for your Spark jobs to read and write from.

## Prerequisites

To run this platform, ensure you have the following installed on your machine:
* [Docker](https://www.docker.com/) (running the daemon)
* [Minikube](https://minikube.sigs.k8s.io/docs/start/)
* [Terraform](https://developer.hashicorp.com/terraform/downloads)
* [kubectl](https://kubernetes.io/docs/tasks/tools/)

## Configuration (`variables.tf`)
All configurations are strictly centralized in the `variables.tf` file. We do not hardcode values in the main logic files. The file is organized into three sections:

1. **Core Kubernetes Settings:** Manages namespaces and cluster connections.
2. **JupyterHub & Spark Settings:** Controls chart versions, Docker images, admin users, and secure passwords.
3. **MinIO Storage Settings:** Manages bucket names, resource limits, and secure access keys.

## Lifecycle Management

* **To pause the environment** and save RAM (keeps data intact): 
  ```bash
  make stop
  ```
* **To completely tear down** the environment and delete all data: 
  ```bash
  make destroy
  ```