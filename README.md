# Mimer Data Platform

Mimer is a local, lightweight Data Science and Data Engineering platform. It is designed as a fully functional Minimum Viable Product (MVP) for building Lakehouse architectures, testing data pipelines, and running PySpark locally before deploying to the cloud.

The platform relies on a strict separation of Storage, Compute, and Control, representing a modern enterprise data stack.

## The "Holy Trinity" Architecture

1. **Storage (MinIO):** An S3-compatible object storage layer holding our raw data and Delta tables.
2. **Compute (Kubernetes/Spark/Jupyter):** A Minikube cluster running JupyterHub for interactive workspaces and the Spark Operator for heavy data processing.
3. **Control Plane (Next.js):** A custom web portal that acts as the mission control center, communicating directly with the Kubernetes API and MinIO to monitor resources and manage the data catalog.

## Quickstart Guide

To spin up the entire platform locally, you need two terminal windows.

**Terminal 1: Start the Infrastructure**
```bash
# Provisions the Minikube cluster, MinIO, and JupyterHub via Terraform/Helm
make up

# Opens the network tunnels to your local machine
make tunnel
```

**Terminal 2: Start the Control Plane**
```bash
# Navigate to the portal application
cd apps/portal

# Install dependencies (first time only)
npm install

# Start the Next.js development server
make dev 
```

### Endpoints
Once running, you can access the platform services here:
* **Control Plane (Mimer Portal):** `http://localhost:3000`
* **JupyterHub Workspace:** `http://localhost:8080`
* **MinIO Console (Storage UI):** `http://localhost:9001`

## Documentation
For deep dives into the specific layers of the platform, please see the docs folder:
* [Infrastructure & Kubernetes Guide](./docs/infrastructure.md)
* [Control Plane & Frontend Guide](./docs/portal.md)