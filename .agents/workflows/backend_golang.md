---
description: How to scaffold and implement a new Golang Backend Service or Controller
---

# Golang Backend Workflow

When the user asks you to create a new high-performance microservice, CLI tool, or custom Kubernetes controller in Go, strictly follow these steps:

1. **Understand Purpose:** Clarify the exact purpose. If it's a Kubernetes controller, use `client-go`. If it's a simple CRUD API, prefer the standard `net/http` package.
2. **Setup Directory:** Determine the logical home for the project (e.g., `apps/mimer-cli/` or `services/k8s-watcher/`). Create the directory if it doesn't exist.
3. **Initialize Go Module:** Use the `run_command` tool to execute `go mod init <module-name>` inside the designated directory. Example: `go mod init github.com/mimer-data/k8s-watcher`.
4. **Scaffold Structure:**
   - Create a `main.go`.
   - Create a `Makefile` local to the module (or append to the global `Makefile`) containing `build`, `test`, and `run` commands.
5. **Add Dependencies:** If communicating with MinIO, use `run_command` to fetch dependencies: `go get github.com/minio/minio-go/v7`. Remember to set the endpoint to `minio.default.svc.cluster.local:9000` or `localhost:9000` depending on execution context.
6. **Implement Logic & Logging:** Write the core logic in small, testable chunks. Use the standard `"log/slog"` for structured JSON logging.
7. **Write Tests:** Add a `main_test.go` and ensure `go test ./...` passes.
8. **Document:** Ensure the `README.md` or the `docs/architecture.md` is updated to reflect the insertion of this new backend microservice into the platform ecosystem.
