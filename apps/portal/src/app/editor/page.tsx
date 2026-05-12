"use client";

import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { FileTree } from "@/components/FileTree";
import { MinIOBrowser } from "@/components/MinIOBrowser";
import { JobStatus } from "@/components/JobStatus";
import { useSettings } from "@/lib/useSettings";

export default function EditorPage() {
  const [files, setFiles] = useState<{ name: string; path: string; content: string; isDir: boolean }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { settings, isLoaded } = useSettings();

  // Debug: log settings
  useEffect(() => {
    console.log("Editor settings loaded:", settings, "isLoaded:", isLoaded);
  }, [settings, isLoaded]);

  // Use settings for API URL
  const CODE_API_URL = settings.codeApiUrl || "http://localhost:8082";

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (settings.githubToken) {
      headers["Authorization"] = `Bearer ${settings.githubToken}`;
    }
    return headers;
  };

  // Fetch repository files
  const fetchFiles = useCallback(async (repoUrl: string) => {
    if (!isLoaded) {
      setError("Settings not loaded yet. Please wait.");
      return;
    }
    if (!settings.githubToken) {
      setError("GitHub token not configured. Please set it in Settings.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Clone or get status
      const cloneResponse = await fetch(`${CODE_API_URL}/git/clone`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      const cloneData = await cloneResponse.json();
      
      if (cloneData.status === "HEALTHY") {
        setRepo(repoUrl);
        // List files from the cloned repo
        const repoName = repoUrl.split("/").pop()?.replace(".git", "") || "repo";
        const listResponse = await fetch(`${CODE_API_URL}/minio/ls?bucket=mimer&path=/tmp/repos/${repoName}`, {
          headers: getAuthHeaders(),
        });
        const listData = await listResponse.json();
        
        if (listData.status === "HEALTHY" && listData.files) {
          const fileList = listData.files.map((f: any) => ({
            name: f.name,
            path: f.name,
            content: "",
            isDir: f.is_dir,
          }));
          setFiles(fileList);
        }
      } else {
        setError(cloneData.message || "Failed to clone repository");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setIsLoading(false);
    }
  }, [CODE_API_URL]);

  // Load file content
  const loadFileContent = useCallback(async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const repoName = repo.split("/").pop()?.replace(".git", "") || "repo";
      const fullPath = `/tmp/repos/${repoName}/${filePath}`;
      
      const response = await fetch(`${CODE_API_URL}/minio/read?bucket=mimer&path=${encodeURIComponent(fullPath)}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.status === "HEALTHY") {
        setFileContent(data.content || "");
        setSelectedFile(filePath);
      } else {
        setError(data.message || "Failed to read file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file content");
    } finally {
      setIsLoading(false);
    }
  }, [repo, CODE_API_URL]);

  // Save file content
  const saveFileContent = useCallback(async (content: string) => {
    if (!selectedFile || !repo) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const repoName = repo.split("/").pop()?.replace(".git", "") || "repo";
      const localPath = `/tmp/repos/${repoName}`;
      
      const response = await fetch(`${CODE_API_URL}/git/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          repo_url: repo,
          local_path: localPath,
          file_path: selectedFile,
          content: content,
          commit_msg: `Update ${selectedFile}`,
        }),
      });
      const data = await response.json();
      
      if (data.status !== "HEALTHY") {
        setError(data.message || "Failed to save file");
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, repo, CODE_API_URL]);

  // Execute code
  const executeCode = useCallback(async () => {
    if (!selectedFile || !repo) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${CODE_API_URL}/execute`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          repo: repo,
          branch: branch,
          file_path: selectedFile,
          job_type: selectedFile.endsWith(".py") ? "python" : "spark",
        }),
      });
      const data = await response.json();
      
      if (data.status === "PENDING" || data.status === "RUNNING") {
        setJobId(data.job_id);
        setJobStatus(data.status);
        // Start polling for status
        pollJobStatus(data.job_id);
      } else {
        setError(data.message || "Failed to execute");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute code");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, repo, branch, CODE_API_URL]);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${CODE_API_URL}/execute/${jobId}`);
        const data = await response.json();
        
        setJobStatus(data.status);
        
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
        setError(err instanceof Error ? err.message : "Failed to poll job status");
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [CODE_API_URL]);

  // Initial load
  useEffect(() => {
    // For demo purposes, you can set a default repo or leave it empty
    setIsLoading(false);
  }, []);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!selectedFile) return;
    
    const timer = setTimeout(() => {
      saveFileContent(fileContent);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [fileContent, selectedFile, saveFileContent]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Custom Code Editor</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Tree */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-xl font-semibold mb-4">Files</h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter GitHub repo URL"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full p-2 border rounded bg-background text-foreground"
                />
                <button
                  onClick={() => fetchFiles(repo)}
                  disabled={isLoading}
                  className="mt-2 w-full bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load Repository"}
                </button>
              </div>
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={(file) => {
                  setSelectedFile(file.path);
                  loadFileContent(file.path);
                }}
              />
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border h-[600px]">
              {selectedFile ? (
                <>
                  <div className="p-2 border-b flex justify-between items-center">
                    <span className="font-medium">{selectedFile}</span>
                    <button
                      onClick={executeCode}
                      disabled={isLoading || !fileContent.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isLoading ? "Running..." : "Run Code"}
                    </button>
                  </div>
                  <Editor
                    height="calc(100% - 40px)"
                    defaultLanguage="python"
                    value={fileContent}
                    onChange={(value = "") => setFileContent(value)}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                    }}
                  />
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to edit
                </div>
              )}
            </div>
          </div>

          {/* Job Status & Outputs */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-4 border mb-6">
              <h2 className="text-xl font-semibold mb-4">Job Status</h2>
              {jobId ? (
                <JobStatus
                  jobId={jobId}
                  status={jobStatus}
                  codeApiUrl={CODE_API_URL}
                />
              ) : (
                <p className="text-gray-500">No job running</p>
              )}
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-xl font-semibold mb-4">Outputs</h2>
              {jobId && (
                <MinIOBrowser
                  bucket="outputs"
                  path={jobId}
                  codeApiUrl={CODE_API_URL}
                />
              )}
              {!jobId && (
                <p className="text-gray-500">Run a job to see outputs</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
