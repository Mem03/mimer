# Mimer Platform Backlog

This backlog is unstructured by design. Tasks can be picked up in any order based on current platform needs or engineering interest.

## Security & Identity (IAM)
*Goal: Secure the control plane and ensure users only access authorized data and compute resources.*
- [ ] **Identity Provider (IdP) Integration:** Deploy a centralized identity solution to manage users, groups, and standard authentication protocols (OAuth2/OIDC).
- [ ] **Application Auth Integration:** Gate the Next.js portal behind the IdP to ensure session persistence and secure login.
- [ ] **Fine-Grained RBAC/ABAC:** Implement an authorization layer (Policy-as-Code or Native RBAC) to restrict access to specific storage buckets and compute namespaces based on user roles.
- [ ] **Secret Management:** Implement a secure vaulting solution to inject sensitive credentials (API keys, DB passwords) into workloads at runtime without exposing them in code.

## Git Integration & CI/CD
*Goal: Treat every pipeline, dashboard, and infrastructure component as code with automated versioning.*
- [ ] **Integrated Version Control:** Provision a Git server to host platform code, transformation logic, and orchestration definitions.
- [ ] **Portal-to-Git Sync:** Build a UI interface in the portal that allows users to commit, pull, and push changes to their notebooks or scripts directly.
- [ ] **CI/CD Automation:** Set up an automation engine to trigger unit tests, data quality checks, and container builds upon code pushes.
- [ ] **GitOps Deployment:** Implement a reconciliation loop that automatically syncs the desired state in Git with the live environment in the cluster.

## Data Quality & Governance
*Goal: Ensure the Lakehouse remains a "Source of Truth" by enforcing data contracts and tracking schema evolution.*
- [ ] **Automated Data Validation:** Integrate a validation framework into pipelines to block "Bad Data" from progressing through storage layers based on predefined rules.
- [ ] **Metadata & Schema Registry:** Implement a cataloging service to track table versions and provide a "Git-like" experience (branching/merging) for data assets.
- [ ] **Schema Drift Detection:** Build a monitoring hook to alert engineering when source data structures change unexpectedly.
- [ ] **Data Discovery UI:** Provide a searchable interface within the portal for users to find table descriptions, owners, and documentation.

## Observability & Monitoring
*Goal: Gain deep visibility into the cluster's health, resource consumption, and pipeline performance.*
- [ ] **Metrics Collection & Visualization:** Deploy a time-series database and dashboarding engine to track infrastructure health.
- [ ] **Resource Tracking:** Configure dashboards to monitor compute resource usage and restart loops for all containerized workloads.
- [ ] **Storage Telemetry:** Expose storage metrics to track bucket growth, throughput, and API request latency.
- [ ] **Portal Health Integration:** Embed live cluster health status or resource metrics directly into the Mimer Portal sidebar via API.

## Custom Headless Code Editor
*Goal: Replace standard UIs with a proprietary, fully integrated web-based coding experience.*
- [ ] **The Editor Engine:** Implement a browser-based code editor in the portal providing professional syntax highlighting and autocomplete.
- [ ] **The Communication Bridge:** Establish a real-time connection (e.g., WebSockets) between the frontend and the backend compute kernels.
- [ ] **Execution State:** Build the logic to send code snippets to the kernel and render the resulting output (text, tables, or charts) on screen.
- [ ] **Persistence Layer:** Write logic to save editor state and notebook files directly to the object storage layer.

## Orchestration & Scheduling
*Goal: Move from manual execution to automated, dependency-aware data pipelines.*
- [ ] **Workflow Engine:** Provision a workflow orchestrator to manage task dependencies and scheduling.
- [ ] **Asset Definition:** Define pipelines that programmatically move data through the storage layers (e.g., Bronze/Silver/Gold).
- [ ] **Control Plane Integration:** Add a "Pipelines" tab to the portal that interfaces with the orchestrator's API to show run history and logs.

## Streaming Data Architecture
*Goal: Support real-time data ingestion alongside traditional batch processing.*
- [ ] **Message Broker:** Deploy a distributed messaging system to handle high-frequency event data.
- [ ] **Stream Producer:** Create a mechanism to simulate or ingest real-time events into the message broker.
- [ ] **Stream Processing:** Implement a compute job that continuously consumes the stream and writes to the Lakehouse in near real-time.
- [ ] **Unified Storage:** Enable querying of both batch and streaming data within a single unified table format.

## Integrated AI Platform Agent
*Goal: Bake LLM capabilities into the control plane to act as an autonomous data engineering assistant.*
- [ ] **Schema Intelligence:** Pass data schemas to an LLM to generate SQL or natural language summaries in the Data Catalog.
- [ ] **Automated Troubleshooting:** Build a service that analyzes failed workload logs via LLM to return root cause analysis in the UI.
- [ ] **Predictive Scaling:** Use intelligence to analyze metric history and recommend resource limit adjustments for compute clusters.

## Machine Learning (ML) Workloads
*Goal: Enable end-to-end model training, versioning, and serving.*
- [ ] **Model Training:** Implement a workflow to train models using data pulled directly from the Lakehouse.
- [ ] **Experiment Tracking:** Provision a registry to track model versions, parameters, and performance metrics.
- [ ] **Model Serving:** Create a service to load saved models and expose them via REST API for real-time inference.

## Lightweight Compute
*Goal: Provide a fast, single-node compute alternative for smaller analytical workloads.*
- [ ] **Embedded Analytical Engine:** Deploy a high-performance, local-first database engine for fast SQL execution without the overhead of distributed compute.
- [ ] **Direct Storage Access:** Configure the engine to read and write common file formats directly from object storage.
- [ ] **SQL-First Interface:** Allow analysts to write pure SQL against the Lakehouse via the portal or notebook environment.

## Data Ingestion (EL)
*Goal: Automate extraction from external sources into the raw-data layer.*
- [ ] **Ingestion Engine:** Deploy an Extract-Load (EL) tool to manage connectors for databases and APIs.
- [ ] **Source Connectivity:** Configure connectors for sample external data sources.
- [ ] **Target Mapping:** Standardize the landing of raw data into object storage as optimized file formats.

## Analytics Engineering
*Goal: Bring software engineering best practices to SQL transformations.*
- [ ] **Modular Transformations:** Implement a framework to manage SQL transformations as modular, version-controlled units.
- [ ] **Transformation Execution:** Connect the framework to the platform's compute engines (distributed or lightweight).
- [ ] **Quality Testing:** Implement automated tests (uniqueness, null checks) to validate data at each transformation step.
- [ ] **Lineage Visualization:** Serve documentation and relationship graphs within the portal to show how data flows between models.

## BI as Code
*Goal: Replace manual dashboarding with version-controlled, code-defined metrics.*
- [ ] **Code-Driven Visualization:** Implement a framework that renders dashboards based on code definitions rather than drag-and-drop.
- [ ] **Metrics Layer:** Define a semantic layer to standardize business logic (e.g., "Revenue") across all reports.
- [ ] **Embedded Analytics:** Integrate these dashboards into the Next.js portal to provide a unified user experience.

## Data Lineage & Developer Experience (DX)
*Goal: Automate metadata capture and remove boilerplate from the developer workflow.*
- [ ] **Compute Auto-Initialization:** Configure the compute environment to automatically inject necessary libraries and session variables upon startup.
- [ ] **Passive Lineage Capture:** Implement listeners to capture data lineage and execution plans silently during job execution.
- [ ] **Lineage Explorer:** Build or deploy a UI to visually trace the flow of data from source to destination across the platform.

## Environment Management & Isolation
*Goal: Provide safe, isolated stages for development, testing, and production to prevent experimental code from impacting live data.*
- [ ] **Infrastructure Templating:** Create a reusable infrastructure-as-code pattern to spin up identical mirrors of the platform (Dev/Staging/Prod) within the cluster.
- [ ] **Namespace Isolation:** Implement logical separation at the cluster level to ensure compute resources in "Dev" cannot consume or interfere with "Prod" resources.
- [ ] **Data Environment Parity:** Establish a strategy for "Data Cloning" or "Zero-Copy Linking" so developers can test pipelines against realistic data samples without duplicating massive datasets.
- [ ] **Configuration Management:** Implement a system to manage environment-specific variables (e.g., different storage endpoints or compute limits) across the platform lifecycle.