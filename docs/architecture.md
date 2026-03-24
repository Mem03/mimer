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
- **Role:** The custom interactive Next.js web portal and high-performance Go extensions that govern the platform.
- **Location:** `apps/portal/` and prospective Go microservices.
- **Networking:** The portal interacts with the Kubernetes API to monitor jobs and communicates with MinIO to display the data catalog and lakehouse state.

## Security & Core Assumptions
- The environment relies on a local Minikube context unless stated otherwise.
- **Do not** hardcode passwords or IAM roles inside infrastructure scripts; assume local default admin overrides for development but fallback to secrets handling mechanics.
