---
name: Golang Backend & Extensions
description: Guidelines and best practices for writing Golang code in the Mimer platform (e.g., custom Kubernetes controllers, microservices, CLI tools).
---

# Golang Backend Skill

Use this skill when introducing a new high-performance backend component, migrating existing services (like Next.js API routes) to standalone microservices, or writing custom Kubernetes controllers in Go.

## Framework Specifics & Best Practices

The Mimer platform embraces Go for tasks that require high concurrency, low latency, or deep Kubernetes integration.

### Core Principles
1. **Cloud-Agnostic and Kubernetes-Native:** Use `client-go` instead of `@kubernetes/client-node` when interacting with the K8s API. Keep services stateless where possible.
2. **Standard Library First:** Prioritize the Go standard library (`net/http`, `context`, `encoding/json`) over heavy external frameworks like Gin or Fiber unless specifically needed for complex routing.
3. **Structured Logging:** Use structured logging (e.g., `log/slog` introduced in Go 1.21).

### MinIO / S3 Integration
When writing Go code that interacts with the Mimer storage layer:
* Use the official `github.com/minio/minio-go/v7` or the standard AWS SDK for Go (`github.com/aws/aws-sdk-go-v2`).
* **Crucial:** You must configure the client to use path-style access and point to the local MinIO endpoint (`http://localhost:9000` or the internal K8s service `http://minio.default.svc.cluster.local:9000`).

Example snippet:
```go
package main

import (
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func newMinioClient() (*minio.Client, error) {
	// Always prefer environment variables for portability
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:9000" // fallback for local development only
	}
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")

	// Initialize minio client object.
	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false, // Local MinIO is HTTP by default
	})
}
```

### Module Setup
When creating a new Go project within the repository:
1. Place it in a logical location (e.g., `apps/mimer-cli/` or `apps/metrics-api/`).
2. Run `go mod init <module-name>` to create the `go.mod` file.
3. Add a `Makefile` or integrate it into the root `Makefile` for consistent building and testing (`go build`, `go test`).
4. **Update `AGENTS.md` and this SKILL file** if you establish new architectural patterns during your work.

## AI-First API Design Pattern

When writing Go services that are consumed by AI Orchestrators **as well as** the portal UI, follow the dual-purpose schema pattern established in `apps/metrics-api/main.go`:

### Schema Rules
- **Flat JSON**: No deeply nested objects. Every field must be a first-class key.
- **Status Enums**: Always include a `status` field with values `HEALTHY`, `WARNING`, or `CRITICAL`.
- **Actionability**: Include an `actions []struct{ Action string }` field for every resource. The Orchestrator uses this to decide what to do.
- **Named Queries**: Prefer `?type=<named_query>` over exposing raw PromQL or SQL. The agent caller should not need to know query internals.

### Example Response Shape
```json
{
  "type": "memory_pressure",
  "metrics": [
    {
      "name": "jupyter-user-alpha",
      "value": "95%",
      "status": "CRITICAL",
      "actions": [
        { "action": "Restart pod" },
        { "action": "Increase memory limit" }
      ]
    }
  ]
}
```

## CORS Pattern for Local Services

When a Go service must be consumed by the Next.js portal running on `http://localhost:3000`, always add a CORS middleware. Use a dedicated helper:

```go
func setHeaders(w http.ResponseWriter) {
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}
	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
}

func handleEndpoint(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	// ... handler logic
}
```

## Existing Services

| Service | Path | Port | Purpose |
|---|---|---|---|
| Metrics API | `apps/metrics-api/` | `8081` | Dual-purpose VictoriaMetrics proxy with AI-optimized schema |
