# Agent Instructions (Mimer Data Platform)

Welcome, AI Agent! You are working on the **Mimer Data Platform**. The goal of this project is to build a custom data platform using principles of code-first, lightweight, and cloud-agnostic architecture. 

**CRITICAL SCOPE:** This repository is STRICTLY for building the platform itself. You are NOT to write any PySpark jobs, data processing pipelines, or data analysis scripts. Focus only on infrastructure setup and the interactive portal.

## 🏗️ Architecture & Setup
You must understand the **four-pillar** structure of this repository:
1. **Storage (`infra/minio.tf`)**: MinIO S3-compatible storage.
2. **Compute (`infra/jupyter.tf`, `infra/spark.tf`)**: Kubernetes (Minikube) cluster running JupyterHub and the Spark Operator.
3. **Control Plane (`apps/portal/`)**: A custom Next.js web portal communicating with the K8s API and MinIO.
4. **Observability (`infra/monitoring.tf`, `apps/metrics-api/`)**: VictoriaMetrics (headless, no Grafana) collects telemetry. A Go microservice on port `8081` exposes it via a dual-purpose API (Recharts UI + AI Orchestrator flat schema).

### Tech Stack
* **Infrastructure (`infra/`)**: Terraform (primary), Helm, Kubernetes.
* **Portal (`apps/portal/`)**: Next.js (App Router), React 19, TypeScript (primary), Tailwind CSS v4.
* **Metrics API (`apps/metrics-api/`)**: Go (`net/http`, stdlib-only). See `.agents/skills/backend_golang/SKILL.md` for the AI-first API design pattern (flat schema, status enums, `actions[]`).
* **Backend/Extensions**: Golang. Use Go when adding new high-performance microservices, custom Kubernetes operators, or backend APIs where relevant.
* **Scripts**: `Makefile` at the root and in `apps/portal/`.

## 📜 Agent Rules (What You Can & Cannot Do)

### ✅ What You MUST Do
* **Read Context:** Always read this `AGENTS.md` and check `docs/` before making architectural decisions.
* **Keep Knowledge Updated:** When introducing a new tool, migrating to a new language (e.g., from Node to Go), or heavily refactoring, you MUST update the relevant `.agents/skills/SKILL.md` files, `README.md`, and `docs/` to reflect these changes before concluding your work.
* **Use TypeScript:** When editing the `apps/portal`, always provide strict type definitions. Do not use `any`.
* **Handle Secrets Securely:** Use Kubernetes Secrets for deployed services and `.env` files for the local Next.js portal. **NEVER** hardcode credentials, tokens, or environment-specific URLs/ports in the codebase.
* **Prioritize Portability:** All services must be dynamic and portable. Use environment variables for endpoints, ports, and external service URLs.
* **AI Readiness:** Design APIs and data structures with AI consumption in mind. Prefer flat schemas, clear status enums, and explicit `actions[]` arrays where applicable (e.g., for orchestrator integration).
* **Follow Existing Workflows:** If the user asks you to perform a task covered by a file in `.agents/workflows/`, you must read that workflow file first and follow its exact steps.
* **Run Validations:** When writing Terraform, validate it. When writing frontend code, keep it lint-free.
* **Be Specific:** Create detailed and isolated components in the UI rather than huge monolythic files. 

### ❌ What You CANNOT Do
* **DO NOT write data pipelines.** No PySpark, no data processing scripts. This repo is for building the platform, not using it.
* **DO NOT** modify `.tfstate` files directly. Terraform state is managed by the Terraform binary.
* **DO NOT** bypass the `Makefile`. If a command exists in the Makefile (e.g., `make up`, `make dev`, `make api`), use it instead of typing out long Docker/Kubernetes/Go commands natively.
* **DO NOT** use default, generic hex colors or plain CSS in the portal. Use Tailwind utility classes and stick to a modern aesthetic.
* **DO NOT** hallucinate Kubernetes Kubeconfig contexts. Assume the environment is local Minikube unless explicitly told otherwise.
* **DO NOT** be alarmed by `[DEP0169] url.parse()` deprecation warnings in the Next.js dev server. This is an upstream issue in `@kubernetes/client-node` and does not affect functionality.

### 🔄 Decision-Making Protocol
- **Always Ask for User Input:**
  - If a task can be implemented using multiple tools, languages, or infrastructure approaches (e.g., Go vs. TypeScript, Kubernetes vs. Docker Compose, or MinIO vs. AWS S3), you **MUST** pause and ask the user for a decision before proceeding.
  - Example scenarios:
    - Choosing a programming language for a new microservice.
    - Selecting a cloud provider or storage backend.
    - Deciding between two architectural patterns (e.g., REST vs. GraphQL).
  - **Prompt:** *"This task can be implemented in [Option A] or [Option B]. Which would you prefer, or should I provide a recommendation?"*

### 📝 Documentation Updates
- **Mandatory Post-Refactor Documentation:**
  - After completing any **large chane** (e.g., adding a new tool or feature, migrating a service from Node.js to Go, restructuring the `infra/` folder, or changing the observability stack), you **MUST**:
    1. Update the relevant `docs/` files to reflect the new architecture, APIs, or workflows.
    2. Add or update `.agents/skills/SKILL.md` files if the change introduces new tools or patterns.
    3. Ensure all `README.md` files in affected directories are up-to-date.
  - **Prompt:** *"I’ve completed the refactor. Here’s a summary of changes: [list]. I’ll now update the documentation in `docs/` and `.agents/skills/`. Should I proceed, or would you like to review the changes first?"*
1
## 🛠️ Workflows
Agent-specific standard operating procedures are located in `.agents/workflows/`. Use the `view_file` tool to read them when prompted by the user to perform standard tasks.
