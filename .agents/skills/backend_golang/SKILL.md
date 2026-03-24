---
name: Golang Backend & Extensions
description: Guidelines and best practices for writing Golang code in the Mimer platform (e.g., custom Kubernetes controllers, microservices, CLI tools).
---

# Golang Backend Skill

Use this skill when introducing a new high-performance backend component, migrating existing services (like Next.js API routes) to standalone microservices, or writing custom Kubernetes controllers in Go.

## 🛠️ Framework Specifics & Best Practices

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
	endpoint := "localhost:9000" // Or fallback via os.Getenv("MINIO_ENDPOINT")
	accessKeyID := "admin"
	secretAccessKey := "minio123"

	// Initialize minio client object.
	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false, // Local MinIO is HTTP by default
	})
}
```

### Module Setup
When creating a new Go project within the repository:
1. Place it in a logical location (e.g., `apps/mimer-cli/` or `services/k8s-watcher/`).
2. Run `go mod init <module-name>` to create the `go.mod` file.
3. Add a `Makefile` or integrate it into the root `Makefile` for consistent building and testing (`go build`, `go test`).
4. **Update `AGENTS.md` and this SKILL file** if you establish new architectural patterns during your work.
