resource "kubernetes_namespace" "mimer" {
  metadata {
    name = var.namespace
  }
}