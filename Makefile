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
	@echo "🔄 Syncing infra outputs to portal..."
	@cd infra && terraform output -raw minio_endpoint > ../apps/portal/.env.local 2>/dev/null || true
	@echo "NEXT_PUBLIC_MINIO_URL=http://localhost:9000" >> apps/portal/.env.local

# 3. Smart Tunneling (Kills old tunnels first to save RAM)
tunnel:
	@echo "🔌 Resetting Tunnels..."
	@pkill -f "port-forward" || true
	@kubectl port-forward -n mimer svc/proxy-public 8080:80 > /dev/null 2>&1 &
	@kubectl port-forward -n mimer deployment/minio 9001:9001 > /dev/null 2>&1 &
	@kubectl port-forward -n mimer svc/minio 9000:9000 > /dev/null 2>&1 &
	@echo "✅ Tunnels active: Jupyter (8080), MinIO UI (9001), MinIO API (9000)"

# 4. Start the Next.js Portal
ui:
	cd apps/portal && npm run dev

# 5. Combined Dev Mode (The 'I want to work' command)
# This starts the UI and ensures tunnels are open
dev:
	@make tunnel
	@make ui

# 6. Maintenance
stop:
	minikube stop

destroy:
	cd infra && terraform destroy -auto-approve
	minikube delete