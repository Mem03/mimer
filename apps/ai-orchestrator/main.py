import os
import asyncio
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / "../portal/.env.local"
load_dotenv(dotenv_path=env_path)

from agents.sre_agent import sre_agent
from core.deps import MimerDeps

# This will hold the most recent analysis so the portal can fetch it instantly
latest_sre_state = {
    "timestamp": None,
    "analysis": "Waiting for first agent run..."
}

async def sre_monitoring_loop():
    """The infinite loop that makes the Agent run constantly."""
    deps = MimerDeps()
    while True:
        try:
            print("Running scheduled SRE analysis...")
            result = await sre_agent.run(
                "Analyze the memory pressure of the cluster. Are there any immediate OOMKill risks?",
                deps=deps
            )
            # Update the global state with the new analysis
            latest_sre_state["analysis"] = result.output
            latest_sre_state["timestamp"] = datetime.now().isoformat()
        except Exception as e:
            print(f"Agent Loop Error: {e}")
        
        # Go to sleep for 60 seconds before checking again (saves API tokens!)
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create the background loop task
    loop_task = asyncio.create_task(sre_monitoring_loop())
    yield
    # Shutdown: Cancel the task gracefully
    loop_task.cancel()

app = FastAPI(title="Mimer AI Orchestrator", lifespan=lifespan)

# --- 2. ADD THIS ENTIRE BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

@app.get("/api/sre/latest")
async def get_latest_sre_status():
    """The Next.js portal will constantly poll this instant endpoint."""
    return latest_sre_state