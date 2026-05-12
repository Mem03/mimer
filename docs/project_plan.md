# Custom Code Editor Plan

## Overview

Build a **custom, browser-based code editor** using Monaco Editor, Go, and K8s. The editor will:

- Edit Python/Spark notebooks and scripts.
- Save code to **GitHub** (via dedicated Go backend).
- Execute code via **Spark Operator (Spark)** or **K8s Jobs (Python)**.
- Store all outputs in **MinIO**.
- Follow **AI-first API design** for all backend endpoints.

---

## Tech Stack

| Component | Technology | Purpose | Reuse from Existing |
| --------- | ---------- | ------- | ------------------ |
| **Editor UI** | Monaco Editor + React | Embeddable, VS Code-like editing. | Portal patterns (Next.js, TS, Tailwind) |
| **Notebooks** | `@jupyterlab/nbformat` | Parse/render `.ipynb` files. | New dependency |
| **Frontend** | Next.js + TypeScript | Host Monaco, integrate with portal. | Existing `apps/portal/` |
| **Backend** | Go (`net/http`, stdlib-first) | **New service:** Git, MinIO, K8s execution. | AI-first pattern from `metrics-api` |
| **Git** | `go-git` | Clone/push/pull from GitHub. | SKILL.md approved |
| **MinIO** | `minio-go/v7` | MinIO operations. | SKILL.md approved |
| **K8s** | `client-go` | Submit Spark jobs / K8s Jobs. | SKILL.md approved |
| **Execution** | Spark Operator + K8s Jobs | Spark: Spark Operator; Python: K8s Jobs. | Existing cluster resources |
| **Storage** | MinIO | All outputs + user data. | Existing `mimer` namespace |
| **Deployment** | K8s + Ingress | Separate from `metrics-api`. | Existing Terraform/Helm patterns |

---

## Architecture

### Frontend (Next.js) - **Embedded in Portal**

- **Location**: `apps/portal/pages/editor/` (or `app/editor/`)
- **Monaco Editor**: Core editor for files/notebooks.
- **Custom Components**:
  - File tree (linked to Git backend).
  - Notebook cell rendering (using `@jupyterlab/nbformat`).
  - MinIO file browser (for outputs).
- **Actions**:
  - Save to GitHub (via `code-api` backend).
  - Run code (submits to `code-api` for Spark/K8s execution).

**Reuse**: Existing portal infrastructure, styling, and K8s client setup.

---

### Backend (Go) - **New Service: `apps/code-api/`**

**Separate from `metrics-api`** (different domain: code editing vs. observability).

#### Service Details
- **Path**: `apps/code-api/`
- **Port**: `8082` (or configurable via env var)
- **Pattern**: AI-first API design (flat JSON, status enums, `actions[]`)

#### **AI-First Schema Rules (from `metrics-api`)**
- Flat JSON: No deeply nested objects
- Status enums: `HEALTHY`, `WARNING`, `ERROR`, `PENDING`
- Actionability: Every resource includes `actions[]` for AI/Orchestrator consumption

#### Endpoints

**Git Operations**
```
POST /git/clone     - Clone a GitHub repo
POST /git/save      - Commit/push changes
GET  /git/status    - Repo status (dirty/clean)
```

**MinIO Operations**
```
GET  /minio/ls      - List files in bucket/path
GET  /minio/read    - Read a file (returns content)
POST /minio/write   - Write a file
```

**Execution**
```
POST /execute        - Submit Spark job or K8s Job
GET  /execute/:id   - Job status (AI-first response)
```

#### Example AI-First Response (`GET /execute/{job_id}`)
```json
{
  "type": "spark_job",
  "job_id": "job-abc123",
  "namespace": "mimer",
  "repo": "user/repo-name",
  "branch": "main",
  "file_path": "jobs/transform.py",
  "status": "PENDING",
  "progress": "50%",
  "output_location": "minio://outputs/job-abc123/",
  "actions": [
    {"action": "Poll job status", "endpoint": "/execute/job-abc123"},
    {"action": "Cancel job", "endpoint": "/execute/job-abc123/cancel"},
    {"action": "View outputs", "endpoint": "/minio/read?path=outputs/job-abc123/"}
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Reused Patterns from `metrics-api`
- CORS middleware (for portal access)
- Environment variable configuration (no hardcoded endpoints)
- Structured logging (`log/slog`)
- Error handling with flat error responses

---

### Execution Flow

```
1. User edits a notebook/script in Monaco (portal).
2. Frontend sends changes to code-api (`POST /git/save`).
3. code-api commits/pushes to GitHub.
4. User clicks "Run":
   - Frontend calls code-api (`POST /execute` with repo, branch, file_path).
   - code-api submits Spark job (Spark Operator) or K8s Job.
5. Execution pod/job:
   - Clones GitHub repo.
   - Runs code.
   - Writes outputs to MinIO.
6. User polls job status (`GET /execute/{id}`) - **AI-first response**.
7. User views outputs via MinIO browser or editor integration.
```

---

## Key Decisions

1. **Editor**: Monaco + React (embedded in `apps/portal/`)
2. **Notebooks**: `@jupyterlab/nbformat` for parsing/rendering
3. **Git**: Backend proxy with Go + `go-git` (SKILL.md compliant)
4. **Backend**: **New service** `apps/code-api/` (separate from `metrics-api`)
5. **API Design**: AI-first (flat schema, status enums, `actions[]`)
6. **MinIO**: `minio-go/v7` (SKILL.md compliant)
7. **K8s**: `client-go` (SKILL.md compliant)
8. **Execution**:
   - Spark: Spark Operator
   - Python: K8s Jobs
9. **Storage**: MinIO for outputs + user data
10. **Deployment**: K8s Deployment + Service + Ingress (separate from `metrics-api` on port 8081)

---

## Reuse from Existing Codebase

| Component | From | Reuse Method |
|-----------|------|--------------|
| AI-first API pattern | `apps/metrics-api/main.go` | Apply same schema rules |
| CORS middleware | `.agents/skills/backend_golang/SKILL.md` | Use provided helper |
| MinIO client setup | `.agents/skills/backend_golang/SKILL.md` | Use example code |
| K8s client | `client-go` (SKILL.md) | Shared patterns |
| Portal integration | `apps/portal/` | Embed editor in existing structure |
| Deployment patterns | `infra/` | Terraform/Helm consistency |
| Environment config | Existing pattern | No hardcoded URLs/ports |

---

## Next Steps

### 1. Backend (`apps/code-api/`)
- [ ] Initialize Go module (`go mod init github.com/mimer-platform/code-api`)
- [ ] Implement CORS middleware (reuse from SKILL.md)
- [ ] Add MinIO client (`minio-go/v7`) with env var config
- [ ] Add K8s client (`client-go`) with in-cluster config
- [ ] Add Git client (`go-git`) with OAuth/token auth
- [ ] Implement `/git/*` endpoints with AI-first responses
- [ ] Implement `/minio/*` endpoints with AI-first responses
- [ ] Implement `/execute` endpoint with Spark Operator / K8s Jobs integration
- [ ] Add health check endpoint (`/healthz`)

### 2. Frontend (`apps/portal/`)
- [ ] Add Monaco Editor dependency
- [ ] Create editor page with file tree
- [ ] Add notebook rendering (`@jupyterlab/nbformat`)
- [ ] Connect to `code-api` endpoints (port 8082)
- [ ] Add "Run" button that calls `/execute`
- [ ] Add job status polling with AI-first response handling
- [ ] Add MinIO file browser component

### 3. Integration
- [ ] Configure CORS in `code-api` to allow portal origin
- [ ] Add `code-api` service to K8s cluster
- [ ] Update portal environment variables to point to `code-api` service
- [ ] Test end-to-end: edit → save → run → view outputs

### 4. Deployment
- [ ] Create K8s Deployment + Service for `code-api` (port 8082)
- [ ] Create Ingress route for `code-api` (optional, if external access needed)
- [ ] Configure RBAC for `code-api` service account (Spark job submission)
- [ ] Add to root `Makefile` for consistent dev workflow

---

## Resources

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [go-git](https://github.com/go-git/go-git)
- [minio-go](https://github.com/minio/minio-go)
- [client-go](https://github.com/kubernetes/client-go)
- [Spark Operator](https://github.com/GoogleCloudPlatform/spark-on-k8s-gcp)
- [@jupyterlab/nbformat](https://github.com/jupyterlab/jupyterlab/tree/main/packages/nbformat)
- [metrics-api AI-first pattern](apps/metrics-api/main.go)
