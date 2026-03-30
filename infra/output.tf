# --- MinIO ---
output "minio_internal_url" {
  value = "http://minio.${var.namespace}.svc.cluster.local:9000" 
}
output "minio_external_url" {
  value = "http://localhost:9000"
}

# --- Jupyter ---
output "jupyter_internal_url" {
  value = "http://hub.${var.namespace}.svc.cluster.local:8081" 
}
output "jupyter_external_url" {
  value = "http://localhost:8080"
}

# --- VictoriaMetrics & API ---
output "vm_internal_url" {
  value = "http://vmsingle-vm-stack-victoria-metrics-k8s-stack.${var.monitoring_namespace}.svc.cluster.local:8429"
}
output "vm_external_url" {
  value = "http://localhost:8428"
}
output "metrics_api_external_url" {
  value = "http://localhost:8081"
}

# --- Secrets (Sensitive) ---
output "minio_access_key" {
  value     = var.minio_access_key
  sensitive = true
}

output "minio_secret_key" {
  value     = var.minio_secret_key
  sensitive = true
}

output "jupyter_password" {
  value     = var.jupyter_dummy_password
  sensitive = true
}