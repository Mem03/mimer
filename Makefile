.PHONY: up down status tunnel

# Start everything
up:
	minikube start
	terraform apply -auto-approve
	@echo "Platform is waking up. Run 'make tunnel' in a new tab."

# Stop everything (Saves RAM, keeps data)
stop:
	minikube stop

# Nuke everything (Deletes data!)
destroy:
	terraform destroy -auto-approve
	minikube delete

# Reopen all the tunnels we need
tunnel:
	@echo "Opening tunnels..."
	@kubectl port-forward -n mimer svc/proxy-public 8080:80 &
	@kubectl port-forward -n mimer deployment/minio 9001:9001 &
	@kubectl port-forward -n mimer svc/minio 9000:9000 &