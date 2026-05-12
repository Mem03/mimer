from pydantic import BaseModel, Field

class MetricDetail(BaseModel):
    # Mapping to Go's MetricItem struct
    name: str = Field(description="Name of the pod or resource, e.g., jupyter-user-alpha")
    usage: str = Field(description="Current resource usage, e.g., 1850.5 MB")
    limit: str = Field(description="Maximum resource limit, e.g., 2048.0 MB or Unlimited")
    trend_15m: str = Field(description="Trend over the last 15 minutes, e.g., +120.5 MB")
    restarts: int = Field(description="Number of pod restarts. High numbers indicate a CrashLoop")
    cpu_throttled: str = Field(description="Whether the CPU is throttled, Yes or No")
    network_receive: str = Field(description="Download velocity in MB/s")

class ClusterTelemetry(BaseModel):
    # Mapping to Go's MetricsResponse struct
    type: str = Field(description="The type of metric queried, e.g., memory_pressure")
    metrics: list[MetricDetail] = Field(description="List of metric details for the query")