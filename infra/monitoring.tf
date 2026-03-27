# Create the dedicated namespace for all monitoring tools
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = var.monitoring_namespace
  }
}

# Deploy the "Headless" VictoriaMetrics Stack
resource "helm_release" "victoria_metrics" {
  name       = "vm-stack"
  repository = "https://victoriametrics.github.io/helm-charts"
  chart      = "victoria-metrics-k8s-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "0.24.0"

  values = [
    jsonencode({
      # Disable Grafana to build our own custom Next.js UI
      grafana = { enabled = false }
      
      # Disable the standard Prometheus Operator to keep Minikube lean
      prometheusOperator = { enabled = false }

      vmsingle = {
        enabled = true
        spec = {
          retentionPeriod = var.vm_retention_period
          resources = {
            requests = { cpu = "100m", memory = "256Mi" }
            limits   = { cpu = "500m", memory = "512Mi" }
          }
        }
      }
      
      vmagent = {
        enabled = true
        spec = {
          resources = {
            requests = { cpu = "50m", memory = "64Mi" }
          }
        }
        # Add these to tell vmagent to scrape the cluster infrastructure!
        config = {
          kubernetes_sd_configs = [{ role = "node" }, { role = "pod" }]
        }
      }
    })
  ]
}

# 1. Scraper for MinIO Storage
resource "kubernetes_manifest" "minio_scrape" {
  manifest = {
    apiVersion = "operator.victoriametrics.com/v1beta1"
    kind       = "VMServiceScrape"
    metadata = {
      name      = "minio-scrape"
      namespace = var.monitoring_namespace
    }
    spec = {
      selector = {
        matchLabels = {
          "app.kubernetes.io/name" = "minio" # Matches chart name in minio.tf 
        }
      }
      namespaceSelector = {
        matchNames = [var.namespace] # Matches 'mimer' 
      }
      endpoints = [
        {
          port = var.minio_service_port_name
          path = "/minio/v2/metrics/cluster"
        }
      ]
    }
  }
}

# 2. Scraper for the JupyterHub "Brain"
resource "kubernetes_manifest" "jupyterhub_scrape" {
  manifest = {
    apiVersion = "operator.victoriametrics.com/v1beta1"
    kind       = "VMServiceScrape"
    metadata = {
      name      = "jupyterhub-scrape"
      namespace = var.monitoring_namespace
    }
    spec = {
      selector = {
        matchLabels = {
          "component" = "hub" # Default label for Hub service 
        }
      }
      namespaceSelector = {
        matchNames = [var.namespace]
      }
      endpoints = [
        {
          port = "http"
          path = "/hub/metrics"
        }
      ]
    }
  }
}

# 3. Scraper for Jupyter User Kernels (Actual Compute Impact)
resource "kubernetes_manifest" "jupyter_kernels_scrape" {
  manifest = {
    apiVersion = "operator.victoriametrics.com/v1beta1"
    kind       = "VMPodScrape"
    metadata = {
      name      = "jupyter-kernels-scrape"
      namespace = var.monitoring_namespace
    }
    spec = {
      selector = {
        matchLabels = {
          "component" = "singleuser-server" # Label for pods spawned by Hub 
        }
      }
      namespaceSelector = {
        matchNames = [var.namespace]
      }
      podMetricsEndpoints = [
        {
          port = var.jupyter_notebook_port_name
          path = "/metrics"
        }
      ]
    }
  }
}