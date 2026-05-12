"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface JobStatusProps {
  jobId: string;
  status: string;
  codeApiUrl: string;
}

interface ExecuteResponse {
  type: string;
  job_id: string;
  status: string;
  progress?: string;
  message?: string;
  actions?: { action: string; endpoint: string }[];
  timestamp?: string;
}

export function JobStatus({ jobId, status: initialStatus, codeApiUrl }: JobStatusProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [progress, setProgress] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${codeApiUrl}/execute/${jobId}`);
      const data: ExecuteResponse = await response.json();
      
      setStatus(data.status || "UNKNOWN");
      setProgress(data.progress || "");
      setMessage(data.message || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job status");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, codeApiUrl]);

  useEffect(() => {
    // Poll for status updates
    const interval = setInterval(() => {
      if (status === "PENDING" || status === "RUNNING") {
        fetchStatus();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  // Initial fetch
  useEffect(() => {
    if (initialStatus === "PENDING" || initialStatus === "RUNNING") {
      fetchStatus();
    }
  }, [initialStatus, fetchStatus]);

  const getStatusIcon = () => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="text-green-500" size={20} />;
      case "FAILED":
        return <XCircle className="text-red-500" size={20} />;
      case "RUNNING":
        return <Loader2 className="animate-spin text-blue-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500";
      case "FAILED":
        return "text-red-500";
      case "RUNNING":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  };

  if (isLoading && !initialStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin" size={20} />
        <span className="ml-2">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>{status}</span>
      </div>
      
      {progress && (
        <div className="text-sm">
          <span className="text-gray-500">Progress:</span> {progress}
        </div>
      )}
      
      {message && (
        <div className="text-sm text-gray-600">{message}</div>
      )}

      <div className="pt-2">
        <div className="text-sm text-gray-500">Job ID</div>
        <div className="font-mono text-sm truncate">{jobId}</div>
      </div>
    </div>
  );
}
