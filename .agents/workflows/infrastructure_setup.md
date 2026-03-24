---
description: How to start and verify the local infrastructure (MinIO, Jupyter Hub, Spark K8s)
---

# Infrastructure Setup Workflow

Use this workflow when the user asks you to start up the environment or verify if the infrastructure is running.

## Step 1: Start the cluster and services
Go to the root directory `/Users/MarcusEgelundMuller/mimer` and run the Makefile command:

```bash
make up
```
*Note: This might take several minutes as Terraform provisions Helm releases onto Minikube.*

## Step 2: Open tunnels (Async)
Because Minikube is used, network tunnels must be opened to access the services from `localhost`.
Run the following root Makefile command in the background (or instruct the user to run it in a separate terminal):

```bash
make tunnel
```

## Step 3: Verify access
Check if the services are accessible:
* **MinIO Console:** Try pinging `http://localhost:9001` or using `curl`. (Default login usually `admin`/`password` depending on TF variables).
* **JupyterHub:** Check `http://localhost:8080`.

## Step 4: Start the Control Plane (Portal)
Navigate to `apps/portal/` and start the Next.js app:

```bash
cd apps/portal
npm install
make dev
```
The portal will be available at `http://localhost:3000`.
