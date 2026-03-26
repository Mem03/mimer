# Mimer Control Plane (Next.js)

The Mimer Portal is a custom Next.js 15 application using the App Router. It serves as the unified UI for the Lakehouse, replacing the need for engineers to constantly write CLI commands or check separate AWS/Kubernetes dashboards.

## Architecture

The portal acts as a bridge between the user and the backend APIs:

* **Storage SDK (`@aws-sdk/client-s3`):** Connects to MinIO to list databases and calculate table sizes. It also performs "metadata surgery" on Delta Lake transaction logs to identify active Parquet files for the frontend.
* **DuckDB-Wasm Integration:** An in-browser analytical database engine that queries Parquet files directly from MinIO. This allows for live, adaptive data previews without the overhead of a middleman API or database.
* **Kubernetes SDK (`@kubernetes/client-node`):** Uses the local `~/.kube/config` to securely query the Minikube API. It tracks active Jupyter pods, container restart counts, and hardware allocations.



## Project Structure

We follow strict DRY (Don't Repeat Yourself) principles and component modularity.

* `src/app/page.tsx`: The Data Catalog home page.
* `src/app/table/[name]/page.tsx`: Deep-dive table view with live metadata and data preview tabs.
* `src/app/monitoring/page.tsx`: Platform Health monitoring dashboard (Recharts + AI Advisory panel).
* `src/components/MonitoringDashboard.tsx`: Client component — fetches from the Go Metrics API (`http://localhost:8081`) and renders KPI cards, a memory pressure bar chart, and an AI action advisory for each metric.
* `src/lib/duckdb.ts`: Logic for initializing the WASM worker and configuring S3/HTTPFS extensions for browser-side SQL.
* `src/components/TablePreview.tsx`: The client-side component that executes DuckDB queries against the live storage.
* `src/lib/`: Backend communication logic (`minio.ts`, `k8s.ts`, `config.ts`).

## Live Data Preview Logic

To ensure the UI is always **adaptable** and "live," we utilize a hybrid querying approach:
1.  **Metadata Layer:** The server reads the Delta Lake `_delta_log` to determine the current state of a table (ignoring overwritten or stale Parquet files).
2.  **Execution Layer:** The list of active files is passed to the browser, where DuckDB-Wasm fetches only the necessary bytes using HTTP Range Requests.



## Design System

The application uses **Tailwind CSS**. All design tokens (colors, fonts, borders) are centralized to ensure a consistent enterprise UI.
* **Colors:** Defined in `tailwind.config.ts` under the `brand` object (e.g., `bg-brand-primary`).
* **Fonts:** We use `next/font/google` (Inter) initialized in `layout.tsx` to prevent layout shifts.

## Environment Variables

The portal relies on a strict `.env.local` file. **Do not commit this file to version control.**

* `NEXT_PUBLIC_MINIO_ENDPOINT`: Browser-accessible endpoint for DuckDB.
* `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`: Administrative keys for server-side S3 operations.

*Note: Multi-tenant workspace configuration (e.g., selecting between the `raw-data` or `marketing-data` buckets) is managed centrally in `src/lib/config.ts`.*

## Monitoring & Metrics Integration

The portal consumes the **Go Metrics API** (`apps/metrics-api/`) at `http://localhost:8081` for all monitoring data. This API:
- Abstracts raw PromQL behind named query types (`?type=memory_pressure|storage_growth|efficiency`).
- Returns flat JSON with `status` enums (`HEALTHY/WARNING/CRITICAL`) and `actions[]` fields for AI orchestrators.
- Must be running via `make api` or `make dev` for the Monitoring page to load data.