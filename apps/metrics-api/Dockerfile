# Step 1: Build the Go binary
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o metrics-api .

# Step 2: Create a tiny image to run it
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/metrics-api .

EXPOSE 8081
CMD ["./metrics-api"]