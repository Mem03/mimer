resource "helm_release" "minio" {
  name       = "minio"
  repository = "https://charts.min.io/"
  chart      = "minio"
  version    = var.minio_chart_version
  namespace  = kubernetes_namespace.mimer.metadata[0].name

  # Crucial for local MVP: Run 1 pod, not 16!
  set {
    name  = "mode"
    value = var.minio_mode
  }

  set {
    name  = "replicas"
    value = var.minio_replicas
  }

  set {
    name  = "persistence.enabled"
    value = var.persistence_enabled
  }

  set {
    name  = "resources.requests.memory"
    value = var.minio_mem_request
  }

  set {
    name  = "resources.requests.cpu"
    value = var.minio_cpu_request
  }

  set {
    name  = "rootUser"
    value = var.minio_access_key
  }

  set {
    name  = "rootPassword"
    value = var.minio_secret_key
  }

  set {
    name  = "buckets[0].name"
    value = var.minio_bucket
  }

  set {
    name  = "buckets[0].policy"
    value = "public"
  }

  set {
    name  = "service.type"
    value = "ClusterIP"
  }

  set {
    name  = "service.port"
    value = "9000"
  }

  set {
    name  = "consoleService.type"
    value = "ClusterIP"
  }

  set {
    name  = "environment.MINIO_BROWSER_LOGIN_ANIMATION"
    value = "off"
  }

}