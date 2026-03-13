# Mimer Control Plane (Next.js)

The Mimer Portal is a custom Next.js 15 application using the App Router. It serves as the unified UI for the Lakehouse, replacing the need for engineers to constantly write CLI commands or check separate AWS/Kubernetes dashboards.

## 🏗️ Architecture

The portal acts as a bridge between the user and the backend APIs:
* **Storage SDK (`@aws-sdk/client-s3`):** Connects to MinIO to list databases, calculate table sizes, and execute secure deletion of Parquet/Delta files.
* **Kubernetes SDK (`@kubernetes/client-node`):** Uses the local `~/.kube/config` to securely query the Minikube API. It tracks active Jupyter pods, container restart counts, and hardware allocations (CPU/Memory limits).

## 📂 Project Structure

We follow strict DRY (Don't Repeat Yourself) principles and component modularity.

* `src/app/page.tsx`: The Data Catalog home page.
* `src/app/compute/page.tsx`: The Compute Clusters monitoring dashboard.
* `src/app/layout.tsx`: Injects global fonts and the shared Sidebar navigation.
* `src/components/`: Reusable React components (like the Sidebar).
* `src/lib/`: Backend communication logic (`minio.ts`, `k8s.ts`, `config.ts`).

## 🎨 Design System

The application uses **Tailwind CSS**. All design tokens (colors, fonts, borders) are centralized to ensure a consistent enterprise UI.
* **Colors:** Defined in `tailwind.config.ts` under the `brand` object (e.g., `bg-brand-primary`).
* **Fonts:** We use `next/font/google` (Inter) initialized in `layout.tsx` to prevent layout shifts.

## ⚙️ Environment Variables

The portal relies on a strict `.env.local` file at the root of the `apps/portal` directory. **Do not commit this file to version control.**

```env
# MinIO / Storage
MINIO_ENDPOINT="http://localhost:9000"
MINIO_REGION="us-east-1"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="minio123"

# Kubernetes / Compute
K8S_NAMESPACE="mimer"
```

*Note: Multi-tenant workspace configuration (e.g., selecting between the `raw-data` or `marketing-data` buckets) is managed centrally in `src/lib/config.ts`.*