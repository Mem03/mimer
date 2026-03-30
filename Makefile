.PHONY: up stop destroy tunnel ui sync-env dev build-api

# 1. Start Infrastructure (Updated!)
up:
	minikube start
	minikube addons enable ingress # Ensure the K8s front-door is open
	@make build-api # Must build the image BEFORE terraform apply!
	cd infra && terraform init && terraform apply -auto-approve
	@make sync-env
	@echo "✨ Infrastructure is UP and UI is synced."

# 2. Build the Go API inside Minikube
build-api:
	@echo "🐳 Building Go Metrics API image inside Minikube..."
	@eval $$(minikube docker-env) && docker build -t mimer-metrics-api:latest ./apps/metrics-api/

# 3. Sync Terraform outputs to Next.js .env
sync-env:
	@echo "🔄 Syncing infra config and secrets to Portal..."
	@echo "NEXT_PUBLIC_MINIO_URL=$(shell cd infra && terraform output -raw minio_external_url)" > apps/portal/.env.local
	@echo "NEXT_PUBLIC_VM_URL=$(shell cd infra && terraform output -raw vm_external_url)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_JUPYTER_URL=$(shell cd infra && terraform output -raw jupyter_external_url)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_METRICS_API_URL=$(shell cd infra && terraform output -raw metrics_api_external_url)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_ACCESS_KEY=$(shell cd infra && terraform output -raw minio_access_key)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_SECRET_KEY=$(shell cd infra && terraform output -raw minio_secret_key)" >> apps/portal/.env.local
	@echo "JUPYTER_PASSWORD=$(shell cd infra && terraform output -raw jupyter_password)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_USE_SSL=false" >> apps/portal/.env.local
    
# 4. Smart Tunneling (Silently runs in the background, no sudo needed)
tunnel:
	@echo "🔌 Resetting Tunnels..."
	@pkill -f "port-forward" || true
	@kubectl port-forward -n mimer svc/metrics-api-service 8081:8081 > /dev/null 2>&1 &
	@kubectl port-forward -n mimer svc/proxy-public 8080:80 > /dev/null 2>&1 &
	@kubectl port-forward -n mimer svc/minio 9000:9000 > /dev/null 2>&1 &
	@kubectl port-forward -n monitoring svc/vmsingle-vm-stack-victoria-metrics-k8s-stack 8428:8429 > /dev/null 2>&1 &
	@echo "✅ Tunnels active: Go API (8081), Jupyter (8080), MinIO (9000/9001)"

# 5. Start the Next.js Portal (Runs in the foreground)
ui:
	@echo "💻 Starting Next.js portal..."
	cd apps/portal && npm run dev

# 6. Combined Dev Mode (The 'I want to work' command)
dev: tunnel ui

# 7. Maintenance (Removed the obsolete Go pkill commands)
stop:
	@pkill -f "port-forward" || true
	@pkill -f "minikube tunnel" || true
	minikube stop

# 8. Cleanup 
destroy:
	cd infra && terraform destroy -auto-approve
	minikube delete