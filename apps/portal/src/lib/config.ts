// In the future, these will be replaced by dynamic functions that read from 
// user cookies or session state to support multiple tenants/workspaces.
export const WORKSPACE_CONFIG = {
  bucket: "raw-data",
  namespace: "mimer",
};

export const PLATFORM_CONFIG = {
  minioUrl: process.env.NEXT_PUBLIC_MINIO_URL!,
  jupyterUrl: process.env.NEXT_PUBLIC_JUPYTER_URL!,
  metricsApiUrl: process.env.NEXT_PUBLIC_METRICS_API_URL!,
};