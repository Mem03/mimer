resource "helm_release" "jupyter" {
  name       = "jupyterlab"
  repository = "https://jupyterhub.github.io/helm-chart/"
  chart      = "jupyterhub" # We use the Hub chart to manage the Lab instance
  namespace  = kubernetes_namespace.mimer.metadata[0].name
  version    = var.jupyterhub_chart_version

  # Simplified for MVP: Single user mode
set {
  name  = "singleuser.image.name"
  value = var.jupyter_image_name
}
set {
  name  = "singleuser.image.tag"
  value = var.jupyter_image_tag
}

  # Allow Jupyter to talk to the Spark Operator
  set {
    name  = "singleuser.serviceAccountName"
    value = kubernetes_service_account.spark_sa.metadata[0].name
  }

  set {
    name  = "proxy.service.type"
    value = "ClusterIP" # We'll port-forward to access it locally
  }

  set {
    name  = "hub.config.Authenticator.admin_users"
    value = var.jupyter_admin_users
  }

  set {
    name  = "hub.config.DummyAuthenticator.password"
    value = var.jupyter_dummy_password
  }

  set {
    name  = "singleuser.profileList[0].display_name"
    value = "Spark Environment"
  }
  set {
    name  = "singleuser.profileList[0].description"
    value = "PySpark\\, Java\\ and S3 Connectors"
  }
  set {
    name  = "singleuser.profileList[0].kubespawner_override.image"
    value = "jupyter/pyspark-notebook:latest"
  }

  set {
    name  = "singleuser.extraEnv.PYTHONPATH"
    value = "/usr/local/spark/python:/usr/local/spark/python/lib/py4j-0.10.9.7-src.zip"
  }

  set {
    name  = "singleuser.extraEnv.SPARK_HOME"
    value = "/usr/local/spark"
  }

  set {
    name  = "singleuser.extraEnv.PYSPARK_PYTHON"
    value = "/opt/conda/bin/python"
  }
}
