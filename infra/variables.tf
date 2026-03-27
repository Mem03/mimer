# ==========================================
# Core Kubernetes Settings
# ==========================================

variable "namespace" {
  type        = string
  description = "The main kubernetes namespace for the platform"
  default     = "mimer"
}

variable "kube_config_path" {
  type        = string
  description = "Path to the kubeconfig file"
  default     = "~/.kube/config"
}

variable "kube_context" {
  type        = string
  description = "The kubernetes context to use"
  default     = "minikube"
}

# ==========================================
# JupyterHub & Spark Settings
# ==========================================

variable "jupyterhub_chart_version" {
  type    = string
  default = "3.2.1"
}

variable "jupyter_image_name" {
  type    = string
  default = "jupyter/pyspark-notebook"
}

variable "jupyter_image_tag" {
  type    = string
  default = "latest" # Consider changing this to a specific version later!
}

variable "jupyter_admin_users" {
  type    = string
  default = "{admin}"
}

variable "jupyter_dummy_password" {
  type        = string
  description = "The password used to log into the JupyterHub environment"
  default     = "mimer2026"
  sensitive   = true
}

variable "portal_url" {
  description = "The URL of the Next.js portal (used for Security Policies and CORS)"
  type        = string
  default     = "http://localhost:3000"
}

# ==========================================
# MinIO Storage Settings
# ==========================================

variable "minio_chart_version" {
  type    = string
  default = "5.0.15"
}

variable "minio_mode" {
  type    = string
  default = "standalone" # Local default
}

variable "minio_replicas" {
  type    = number
  default = 1
}

variable "minio_bucket" {
  type    = string
  default = "raw-data"
}

variable "persistence_enabled" {
  type    = bool
  default = true
}

variable "minio_mem_request" {
  type    = string
  default = "256Mi" # Default for your laptop
}

variable "minio_cpu_request" {
  type    = string
  default = "100m" # Default for your laptop
}

variable "minio_access_key" {
  type    = string
  default = "admin"
}

variable "minio_secret_key" {
  type      = string
  default   = "minio123"
  sensitive = true
}

# ==========================================
# Monitoring Settings (VictoriaMetrics & Grafana)
# ==========================================
variable "monitoring_namespace" {
  description = "Namespace for VictoriaMetrics and Grafana"
  type        = string
  default     = "monitoring"
}

variable "vm_retention_period" {
  description = "How long VictoriaMetrics keeps data (e.g. 14d)"
  type        = string
  default     = "14d"
}

variable "grafana_admin_password" {
  description = "Password for Grafana UI"
  type        = string
  sensitive   = true
  default     = "admin"
}

# ==========================================
# Scraper & Port Settings
# ==========================================

variable "minio_service_port_name" {
  type        = string
  description = "The name of the port in the MinIO service definition"
  default     = "http" # Matches source 
}

variable "jupyter_notebook_port_name" {
  type        = string
  description = "The name of the port for spawned user kernels"
  default     = "notebook-port" # Standard for jupyterhub chart 
}