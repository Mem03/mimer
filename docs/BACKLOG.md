# Mimer Platform Backlog

This backlog is unstructured by design. Tasks can be picked up in any order based on current platform needs or engineering interest.

## Observability & Monitoring (Prometheus)
*Goal: Gain deep visibility into the cluster's health, resource consumption, and pipeline performance.*
- [ ] **Deploy Prometheus & Grafana:** Add the `kube-prometheus-stack` Helm chart to the Terraform infrastructure.
- [ ] **Kubernetes Metrics:** Configure dashboards to track CPU, RAM, and restart loops for Jupyter and Spark pods.
- [ ] **Storage Metrics:** Expose MinIO's `/minio/v2/metrics/cluster` endpoint to Prometheus to track bucket sizes and API requests.
- [ ] **Next.js Integration:** Embed a lightweight Grafana iframe or use Prometheus APIs to show live cluster health directly in the Mimer Portal Sidebar.

## Custom Headless Code Editor
*Goal: Replace the standard Jupyter UI with a proprietary, fully integrated Next.js coding experience.*
- [ ] **The Editor Engine:** Install `@monaco-editor/react` in the Next.js portal to provide VS Code-level syntax highlighting and autocomplete.
- [ ] **The Communication Bridge:** Implement `@jupyterlab/services` to establish a WebSocket connection between the Next.js frontend and the hidden Kubernetes Jupyter pod.
- [ ] **Execution State:** Build a React component that sends `1+1` over the WebSocket and successfully renders `2` on the screen.
- [ ] **Notebook Persistence:** Write logic to save the editor's state as a standard `.ipynb` JSON file directly back to a MinIO bucket.

## Orchestration & Scheduling (Dagster)
*Goal: Move from manual notebook execution to automated, dependency-aware data pipelines.*
- [ ] **Deploy Dagster:** Provision a Dagster instance inside the Minikube cluster using Helm.
- [ ] **Asset Definition:** Write a basic Dagster pipeline (Python) that triggers a Spark job to read from `raw-data` and write to a `cleansed-data` bucket.
- [ ] **Control Plane Integration:** Add a "Pipelines" tab to the Next.js portal that queries the Dagster GraphQL API to show recent run statuses (Success/Failure/Pending).

## Streaming Data Architecture
*Goal: Support real-time data ingestion alongside traditional batch processing.*
- [ ] **Message Broker:** Deploy a lightweight Kafka or Redpanda pod to the cluster via Terraform.
- [ ] **Producer Script:** Write a simple Python script to simulate streaming IoT or clickstream events into a topic.
- [ ] **Spark Structured Streaming:** Create a PySpark job that continuously consumes the stream and appends it to a Delta Table in MinIO in near real-time.
- [ ] **Unified batch and streaming data:** Allow for querying batch and streaming data in a unified table

## Integrated AI Platform Agent
*Goal: Bake LLM capabilities directly into the control plane to act as an autonomous data engineering assistant.*
- [ ] **Data Understanding:** Pass Parquet/Delta schemas to an LLM to auto-generate SQL queries or natural language data summaries in the Data Catalog view.
- [ ] **Log Troubleshooting:** Build a Next.js API route that pulls failed pod logs via the Kubernetes API, sends them to an LLM, and returns a human-readable "Root Cause & Fix" directly in the UI.
- [ ] **Compute Management:** Use an LLM to analyze Prometheus metric history and recommend when to scale up a Spark cluster's CPU limits (or auto-terminate idle Jupyter pods).

## Machine Learning (ML) Workloads
*Goal: Prove the platform can handle end-to-end model training and serving.*
- [ ] **Model Training:** Write a PySpark MLlib or Scikit-Learn notebook that trains a model using data pulled straight from MinIO.
- [ ] **Model Registry:** Deploy MLflow (or just use MinIO as an artifact store) to track model versions, parameters, and accuracy metrics.
- [ ] **Model Serving:** Create a lightweight FastAPI pod that loads the saved `.pkl` or ONNX model from MinIO and exposes a REST API for real-time inference.

## Lightweight Compute (DuckDB)
*Goal: Provide a blazing-fast, single-node compute alternative to Spark for workloads that don't require heavy distributed processing.*
- [ ] **Headless DuckDB Engine:** Deploy a containerized DuckDB server (or use it natively inside Python pods) to run complex analytical queries using a fraction of the RAM of Spark.
- [ ] **MinIO Integration:** Configure DuckDB with the `httpfs` extension to read and write Parquet/CSV files directly from your local Lakehouse buckets.
- [ ] **Jupyter Kernel:** Add a DuckDB SQL kernel to JupyterHub so analysts can write pure, high-speed SQL against MinIO without writing any PySpark boilerplate.

## Data Ingestion (Airbyte / Meltano)
*Goal: Automate the extraction of data from external sources (databases, APIs) and load it into the `raw-data` bucket.*
- [ ] **Deploy Ingestion Engine:** Add the Helm chart for an open-source EL (Extract, Load) tool like Airbyte or Meltano to the Kubernetes cluster.
- [ ] **Sample Source Connection:** Configure a connector to pull data from a public API or a dummy PostgreSQL database.
- [ ] **Lakehouse Destination:** Set up the tool to land the raw, un-transformed data directly into MinIO as Parquet files, ready for downstream processing.

## Analytics Engineering (dbt)
*Goal: Bring software engineering best practices (version control, testing, CI/CD) to your SQL data transformations.*
- [ ] **dbt Core Setup:** Create a `dbt/` folder in the project to manage modular SQL transformations (the "T" in ELT).
- [ ] **Adapter Configuration:** Connect dbt to either your Spark cluster (`dbt-spark`) or your DuckDB engine (`dbt-duckdb`) to execute the models.
- [ ] **Data Quality Testing:** Write standard dbt tests (unique, not_null) for your bronze/silver/gold tables to automatically catch bad data before it hits the catalog.
- [ ] **Next.js Integration:** Serve the auto-generated `dbt docs` static website via an iframe in the Next.js portal for a beautiful, interactive data lineage graph.

## BI as Code (Dashboards & Reporting)
*Goal: Replace click-and-drag BI tools with version-controlled, code-defined dashboards and metrics.*
- [ ] **Evaluate BI Framework:** Choose an open-source BI-as-code tool (e.g., Rill Data, Lightdash, Evidence.dev, or Streamlit) to deploy alongside the control plane.
- [ ] **Define Metrics Layer:** Create a semantic layer using SQL/YAML to define core business metrics (e.g., Daily Active Users, Total Revenue) directly from the MinIO Parquet files.
- [ ] **Build Code-Driven Dashboard:** Write the code to generate an interactive dashboard that automatically updates when the underlying repository or dbt models change.
- [ ] **Portal Embedding:** Embed the compiled dashboards securely into the Next.js Control Plane so users don't have to leave the Mimer application to see their data.

## Agentic Framework for Custom Data Agents
*Goal: Provide an environment where users can build, deploy, and converse with autonomous AI agents equipped with tools to directly interact with Lakehouse data.*
- [ ] **Data Tool-Calling (Function Calling):** Integrate an agent framework (like LangChain, LlamaIndex, or Vercel AI SDK) and build strict tools for the LLM (e.g., `execute_duckdb_sql`, `list_minio_files`, `trigger_dagster_job`).
- [ ] **Agent Builder UI:** Create a portal interface where users can define a custom agent, write its system prompt, and select which specific tools and MinIO buckets it is allowed to access.
- [ ] **Interactive Chat UI:** Build a conversational interface in the Next.js portal where users can ask complex questions ("Why did sales drop yesterday?") and watch the agent autonomously chain together SQL queries and Python scripts to find the answer.
- [ ] **RAG (Retrieval-Augmented Generation):** Deploy a lightweight vector store (like ChromaDB, Qdrant, or pgvector) so your agents can index and search through unstructured data, PDFs, or historical Slack logs stored in the Lakehouse.

## Data Lineage & Developer Experience (DX)
*Goal: Remove boilerplate code from notebooks and automatically track how data flows and transforms across the platform.*
- [ ] **Spark Session Auto-Initialization:** Configure the Jupyter IPython kernel profile with a startup script (`~/.ipython/profile_default/startup/`) to automatically build and inject the `spark` variable into the global namespace upon boot.
- [ ] **Automated Data Lineage:** Install an open-source lineage agent (like OpenLineage or Spline) and attach its Spark listener to the auto-initialized Spark Session to capture execution plans silently.
- [ ] **Lineage Graph UI:** Deploy the Lineage UI (or embed it within the Next.js portal) to visually track which Spark notebook or Dagster pipeline produced which specific Delta table in MinIO.


# Done and dusted
## Data Previewer
*Goal: View the actual contents of the Lakehouse directly from the web browser.*
- [x] Install `duckdb` and `duckdb-wasm` in the Next.js portal.
- [x] Configure DuckDB to authenticate with MinIO using the centralized `.env` credentials.
- [ ] Build a `<DataGrid>` component on the Table Details page to run `SELECT * LIMIT 50` on Parquet files.
