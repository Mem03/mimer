resource "helm_release" "spark_operator" {
  name             = "spark-operator"
  repository       = "https://kubeflow.github.io/spark-operator"
  chart            = "spark-operator"
  namespace        = "spark-operator"
  create_namespace = true

  set {
    name  = "webhook.enable"
    value = "true"
  }
}

# RBAC for Spark to create executor pods
resource "kubernetes_service_account" "spark_sa" {
  metadata {
    name      = "spark-sa"
    namespace = kubernetes_namespace.mimer.metadata[0].name
  }
}

resource "kubernetes_cluster_role_binding" "spark_role_binding" {
  metadata {
    name = "spark-role-binding"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "edit"
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.spark_sa.metadata[0].name
    namespace = kubernetes_namespace.mimer.metadata[0].name
  }
}

resource "kubernetes_secret_v1" "minio_creds" {
  metadata {
    name      = "minio-creds"
    namespace = kubernetes_namespace.mimer.metadata[0].name
  }

  data = {
    access_key = var.minio_access_key
    secret_key = var.minio_secret_key
  }
}