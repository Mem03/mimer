.PHONY: up stop destroy tunnel ui sync-env dev

# 1. Start Infrastructure
up:
	minikube start
	cd infra && terraform init && terraform apply -auto-approve
	@make sync-env
	@echo "✨ Infrastructure is UP and UI is synced."

# 2. Sync Terraform outputs to Next.js .env
# This assumes you have 'outputs' defined in your terraform code
sync-env:
	@echo "🔄 Syncing infra..."
	@echo "NEXT_PUBLIC_MINIO_URL=$(shell cd infra && terraform output -raw minio_external_url)" > apps/portal/.env.local
	@echo "NEXT_PUBLIC_VM_URL=$(shell cd infra && terraform output -raw vm_external_url)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_JUPYTER_URL=$(shell cd infra && terraform output -raw jupyter_external_url)" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_ACCESS_KEY=admin" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_SECRET_KEY=minio123" >> apps/portal/.env.local
	@echo "NEXT_PUBLIC_MINIO_USE_SSL=false" >> apps/portal/.env.local
	
# 3. Smart Tunneling (Kills old tunnels first to save RAM)
tunnel:
	@echo "🔌 Resetting Tunnels..."
	@pkill -f "port-forward" || true
	@kubectl port-forward -n mimer svc/proxy-public 8080:80 > /dev/null 2>&1 &
	@kubectl port-forward -n mimer svc/minio 9000:9000 > /dev/null 2>&1 &
	@kubectl port-forward -n monitoring svc/vmsingle-vm-stack-victoria-metrics-k8s-stack 8428:8429 > /dev/null 2>&1 &
	@echo "✅ Tunnels active: Jupyter (8080), MinIO UI (9001), MinIO API (9000)"

# 4. Start the Go Metrics API
api:
	@echo "🚀 Starting Metrics API on port 8081..."
	@cd apps/metrics-api && /opt/homebrew/bin/go run main.go &

# 5. Start the Next.js Portal
ui:
	cd apps/portal && npm run dev

# 6. Combined Dev Mode (The 'I want to work' command)
# This starts the UI, API, and ensures tunnels are open
dev:
	@make tunnel
	@make api
	@make ui

# 7. Maintenance (Stops minikube and kills tunnels)
stop:
	@pkill -f "port-forward" || true
	@pkill -f "go run main.go" || true
	@pkill -f "metrics-api" || true
	minikube stop

# 8. Cleanup (Destroys infra and deletes minikube cluster)
destroy:
	cd infra && terraform destroy -auto-approve
	minikube delete