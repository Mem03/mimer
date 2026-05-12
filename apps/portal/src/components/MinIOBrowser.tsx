"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, File, Loader2 } from "lucide-react";

interface MinIOBrowserProps {
  bucket: string;
  path: string;
  codeApiUrl?: string;
}

interface MinIOFile {
  name: string;
  size: number;
  is_dir: boolean;
  modified?: string;
}

export function MinIOBrowser({ bucket, path, codeApiUrl = "http://localhost:8082" }: MinIOBrowserProps) {
  const [files, setFiles] = useState<MinIOFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${codeApiUrl}/minio/ls?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`
      );
      const data = await response.json();
      
      if (data.status === "HEALTHY") {
        setFiles(data.files || []);
      } else {
        setError(data.message || "Failed to list files");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setIsLoading(false);
    }
  }, [bucket, path, codeApiUrl]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const toggleDir = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const renderFile = (file: MinIOFile) => {
    const isExpanded = expandedDirs.has(file.name);
    
    if (file.is_dir) {
      return (
        <div key={file.name} className="ml-4">
          <div
            className="flex items-center p-1 rounded cursor-pointer hover:bg-accent"
            onClick={() => toggleDir(file.name)}
          >
            <Folder size={16} className={`mr-2 ${isExpanded ? "text-primary" : ""}`} />
            <span className="truncate">{file.name}</span>
          </div>
        </div>
      );
    }

    return (
      <div key={file.name} className="ml-4">
        <div className="flex items-center p-1 rounded hover:bg-accent">
          <File size={16} className="mr-2" />
          <span className="truncate">{file.name}</span>
          <span className="ml-auto text-sm text-gray-500">{formatFileSize(file.size)}</span>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin" size={20} />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[300px]">
      {files.length === 0 ? (
        <p className="text-gray-500 p-4 text-center">No files found</p>
      ) : (
        files.map(renderFile)
      )}
    </div>
  );
}
