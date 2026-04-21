# ==========================================
# Metrics API (Go Microservice) K8s Resources
# ==========================================
# 3. The Deployment (Runs the actual Go application)
resource "kubernetes_deployment" "metrics_api_deployment" {
  metadata {
    name      = "metrics-api"
    namespace = var.namespace
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "metrics-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "metrics-api"
        }
      }

      spec {
        container {
          # This assumes you will name your Docker image "mimer-metrics-api"
          image             = "mimer-metrics-api:latest" 
          name              = "metrics-api"
          
          # Crucial for Minikube: Tells K8s to use your locally built image
          # instead of trying to download it from the public internet.
          image_pull_policy = "Never" 
          
          env {
            name  = "VM_URL"
            value = "http://vmsingle-vm-stack-victoria-metrics-k8s-stack.monitoring.svc.cluster.local:8429/api/v1/query"
          }

          port {
            container_port = 8081
          }

          # Good practice: Stop the Go app from eating infinite resources
          resources {
            limits = {
              cpu    = "200m"
              memory = "128Mi"
            }
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
          }
        }
      }
    }
  }
}

# 1. The Service (Exposes your Go pods inside the cluster)
resource "kubernetes_service" "metrics_api_service" {
  metadata {
    name      = "metrics-api-service"
    namespace = var.namespace
  }
  spec {
    selector = {
      app = "metrics-api"
    }
    port {
      port        = 8081
      target_port = 8081
    }
    type = "ClusterIP"
  }
}

# 2. The Ingress (The Front Door handling CORS)
resource "kubernetes_ingress_v1" "metrics_api_ingress" {
  metadata {
    name      = "metrics-api-ingress"
    namespace = var.namespace

    annotations = {
      "nginx.ingress.kubernetes.io/enable-cors"        = "true"
      # Dynamically inject the Next.js URL from your variables.tf!
      "nginx.ingress.kubernetes.io/cors-allow-origin"  = var.portal_url 
      "nginx.ingress.kubernetes.io/cors-allow-methods" = "GET, OPTIONS"
      "nginx.ingress.kubernetes.io/cors-allow-headers" = "Content-Type"
    }
  }

  spec {
    rule {
      http {
        path {
          path      = "/api/metrics"
          path_type = "Prefix"
          
          backend {
            service {
              name = "metrics-api-service"
              port {
                number = 8081
              }
            }
          }
        }
      }
    }
  }
}