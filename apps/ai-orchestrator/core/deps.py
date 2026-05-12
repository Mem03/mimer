import httpx
import os
from .models import ClusterTelemetry

class MimerDeps:
    """Dependencies injected into the agent's tool calls."""
    
    def __init__(self):
        # 1. Look for the shared portal variable first (for local dev)
        # 2. Fallback to the internal K8s DNS (for when deployed in cluster)
        self.api_base = os.getenv(
            "NEXT_PUBLIC_METRICS_API_URL", 
            "http://metrics-api.mimer.svc.cluster.local:8081"
        )
        self.client = httpx.AsyncClient()

    async def fetch_metrics(self, query_type: str) -> ClusterTelemetry:
        """Fetches and validates telemetry from the Go API."""
        response = await self.client.get(
            f"{self.api_base}/api/metrics", 
            params={"type": query_type}
        )
        response.raise_for_status()
        
        return ClusterTelemetry.model_validate(response.json())