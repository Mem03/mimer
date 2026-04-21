# apps/ai-orchestrator/Dockerfile
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8000 for the FastAPI server
EXPOSE 8000

# Start the Uvicorn web server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]