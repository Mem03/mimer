from pydantic_ai import Agent, RunContext
import os

from core.deps import MimerDeps
from core.models import ClusterTelemetry

# Initialize the low-latency Flash model
model = os.getenv("LLM_MODEL", "mistral:mistral-small-latest")

# Define the Agent
sre_agent = Agent(
    model,
    deps_type=MimerDeps,
    system_prompt=(
        "You are the Virtual Site Reliability Engineer (SRE) for the Mimer Data Platform. "
        "Your job is to monitor cluster telemetry and ensure stability for Jupyter kernels and Spark workloads. "
        "Review the metrics provided by your tools. "
        "If a pod has high memory pressure or a high restart count, you must flag it as an OOMKill risk. "
        "Keep your responses extremely brief and operational."
    )
)

# --- The Agent's Tools ---

@sre_agent.tool
async def analyze_memory_pressure(ctx: RunContext[MimerDeps]) -> ClusterTelemetry:
    """
    Retrieves real-time RAM usage for Jupyter kernels to check for OOMKill risks.
    The agent should call this tool routinely to monitor cluster health.
    """
    # This calls your Go API via the deps we built
    telemetry_data = await ctx.deps.fetch_metrics("memory_pressure")
    
    # We return the Pydantic model directly; PydanticAI handles formatting it for the LLM
    return telemetry_data