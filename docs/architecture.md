# Mimer Data Platform Architecture

This document outlines the "Holy Trinity" structure of the Mimer Data Platform and the networking boundaries between its components. 

## 1. Storage Layer (MinIO)
- **Role:** The S3-compatible object storage layer acting as the Data Lakehouse foundation.
- **Location:** Defined in `infra/minio.tf` and deployed inside the Kubernetes cluster.
- **Networking:** 
  - **Internal (Within K8s):** Services and pods (like the Spark Operator or Go controllers) communicate with MinIO via `http://minio.default.svc.cluster.local:9000`.
  - **External (Local Machine):** The `make up` command port-forwards MinIO to the host. The local Next.js portal and local scripts communicate with it via `http://localhost:9000`.

## 2. Compute Layer (Kubernetes / Spark)
- **Role:** The processing engine that executes the actual data pipelines and notebooks.
- **Location:** Managed under `infra/jupyter.tf` and `infra/spark.tf`. Currently running locally on Minikube.
- **Networking:** The Spark Operator creates driver and executor pods dynamically that need internal access to MinIO to read/write Parquet/Delta files.

## 3. Control Plane (Portal & Extensions)
- **Role:** The custom interactive Next.js web portal and high-performance Go microservices that govern the platform.
- **Location:** `apps/portal/` for the UI; `apps/metrics-api/` for the Go Metrics API.
- **Networking:** The portal fetches metrics from the Go Metrics API at `http://localhost:8081`. The API in turn proxies PromQL to VictoriaMetrics at `http://localhost:8428`.

## 4. Monitoring Layer (VictoriaMetrics + Go Metrics API)
- **Role:** Collects infrastructure telemetry and exposes it via a dual-purpose API — rich charts for the portal UI and a flat, agent-readable schema for AI Orchestrators.
- **Infrastructure:** Defined in `infra/monitoring.tf`. Deploys the `victoria-metrics-k8s-stack` Helm chart into the `monitoring` namespace. Scrapers are configured for MinIO, JupyterHub, and Jupyter kernel pods.
- **API (`apps/metrics-api/`):** A Go microservice (`net/http`, stdlib only) on port `8081`. Exposes named queries (`?type=memory_pressure|storage_growth|efficiency`) with flat JSON responses including `status` enums and `actions[]` for remediation.
- **Networking:**
  - **Internal (Within K8s):** `vmsingle-vm-stack-victoria-metrics-k8s-stack.monitoring.svc.cluster.local:8429`
  - **External (Local Machine):** `make tunnel` port-forwards VictoriaMetrics to `localhost:8428`. The Go API reads from this.

## Security & Core Assumptions
- The environment relies on a local Minikube context unless stated otherwise.
- **Do not** hardcode passwords or IAM roles inside infrastructure scripts; assume local default admin overrides for development but fallback to secrets handling mechanics.
