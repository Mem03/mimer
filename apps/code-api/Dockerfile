# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o code-api main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/code-api .

# Copy k8s manifests
COPY k8s/ ./k8s/

# Set environment variables
ENV PORT=8082
ENV MINIO_ENDPOINT=minio.mimer.svc.cluster.local:9000
ENV MINIO_ACCESS_KEY=admin
ENV MINIO_SECRET_KEY=minio123
ENV ALLOWED_ORIGIN=http://localhost:3000

EXPOSE 8082

CMD ["./code-api"]
