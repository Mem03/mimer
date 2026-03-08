# Local Data Platform MVP

This project provisions a lightweight, local Data Science and Data Engineering platform on Kubernetes using Terraform and Helm. It is designed to be a Minimum Viable Product (MVP) for testing data pipelines and running PySpark code directly on your laptop.

## 🏗️ Architecture & Components

The platform consists of three main pillars, all running inside a local Minikube cluster:

* **Interactive Workspace (JupyterHub):** Provides a multi-user notebook environment. It is pre-configured with the `jupyter/pyspark-notebook` image to give you instant access to Python, Java, and S3 connectors.
* **Compute Engine (Apache Spark):** Uses the Kubeflow Spark Operator to natively manage Spark applications on Kubernetes. Jupyter is configured to talk directly to this operator via a dedicated Service Account (`spark-sa`).
* **Object Storage (MinIO):** A local, S3-compatible storage layer. It is configured to run in standalone mode with a minimal resource footprint (1 pod, low CPU/RAM) and automatically provisions a `raw-data` bucket for your Spark jobs to read and write from.

## ⚙️ Prerequisites

To run this platform, ensure you have the following installed on your machine:
* [Docker](https://www.docker.com/) (running the daemon)
* [Minikube](https://minikube.sigs.k8s.io/docs/start/)
* [Terraform](https://developer.hashicorp.com/terraform/downloads)
* [kubectl](https://kubernetes.io/docs/tasks/tools/)

## 🚀 Getting Started

We have wrapped the complex deployment steps into a simple `Makefile`.

**1. Start the Platform**
```bash
make up
```
This command starts your Minikube cluster and automatically applies all Terraform configurations.


**2. Access the UIs**
Open a new terminal tab and run:
```bash
make tunnel
```
This opens local network tunnels so you can access the services in your browser.

JupyterHub: ```bash http://localhost:8080 ```

MinIO Console: ```bash http://localhost:9001 ```

MinIO API: ```bash http://localhost:9000 ```

**3. Stop or Destroy**

To pause the environment and save RAM (keeps data): ```bash make stop```

To completely tear down the environment and delete all data: ```bash make destroy```

## 🛠️ Configuration
All configurations are strictly centralized in the variables.tf file. We do not hardcode values in the main logic files.

The variables.tf file is neatly organized into three sections:

Core Kubernetes Settings: Manages namespaces and cluster connections.

JupyterHub & Spark Settings: Controls chart versions, Docker images, admin users, and secure passwords.

MinIO Storage Settings: Manages bucket names, resource limits, and secure access keys.