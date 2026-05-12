"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, GitBranch, Globe, Check } from "lucide-react";

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [minioEndpoint, setMinioEndpoint] = useState("");
  const [minioAccessKey, setMinioAccessKey] = useState("");
  const [minioSecretKey, setMinioSecretKey] = useState("");
  const [codeApiUrl, setCodeApiUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mimer-settings");
    let settings = { githubToken: "", minioEndpoint: "", minioAccessKey: "", minioSecretKey: "", codeApiUrl: "" };
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    setGithubToken(settings.githubToken || process.env.NEXT_PUBLIC_GITHUB_TOKEN || "");
    setMinioEndpoint(settings.minioEndpoint || process.env.NEXT_PUBLIC_MINIO_URL || "localhost:9000");
    setMinioAccessKey(settings.minioAccessKey || process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY || "admin");
    setMinioSecretKey(settings.minioSecretKey || process.env.NEXT_PUBLIC_MINIO_SECRET_KEY || "");
    setCodeApiUrl(settings.codeApiUrl || process.env.NEXT_PUBLIC_CODE_API_URL || "http://localhost:8081");
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    setMessage(null);
    const settings = {
      githubToken,
      minioEndpoint,
      minioAccessKey,
      minioSecretKey,
      codeApiUrl,
    };
    localStorage.setItem("mimer-settings", JSON.stringify(settings));
    setMessage({ type: "success", text: "Settings saved!" });
    setIsLoading(false);
  };

  const handleClear = () => {
    localStorage.removeItem("mimer-settings");
    setGithubToken("");
    setMinioEndpoint("");
    setMinioAccessKey("");
    setMinioSecretKey("");
    setCodeApiUrl("");
    setMessage({ type: "success", text: "Settings cleared!" });
  };

  const successBg = "bg-green-500/20 text-green-400 border border-green-500/30";
  const errorBg = "bg-red-500/20 text-red-400 border border-red-500/30";

  return (
    <div className="bg-background text-foreground p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-7 h-7" />
          Settings
        </h1>
        <p className="text-brand-text mt-1">Configure your connections and credentials</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded ${message.type === "success" ? successBg : errorBg}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" && <Check className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border p-6 space-y-6 min-h-[600px]">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            GitHub
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showGithubToken ? "text" : "password"}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full p-3 bg-background border border-brand-border rounded text-foreground placeholder-brand-text/50 focus:outline-none focus:border-brand-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowGithubToken(!showGithubToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text/50 hover:text-brand-text text-sm"
                >
                  {showGithubToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-brand-text/50 mt-2">
                Required for git operations (clone, push). Generate at: https://github.com/settings/tokens
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border" />

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Code API
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                API URL
              </label>
              <input
                type="url"
                value={codeApiUrl}
                onChange={(e) => setCodeApiUrl(e.target.value)}
                placeholder="http://localhost:8082"
                className="w-full p-3 bg-background border border-brand-border rounded text-foreground placeholder-brand-text/50 focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border" />

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            MinIO
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Endpoint
              </label>
              <input
                type="text"
                value={minioEndpoint}
                onChange={(e) => setMinioEndpoint(e.target.value)}
                placeholder="localhost:9000"
                className="w-full p-3 bg-background border border-brand-border rounded text-foreground placeholder-brand-text/50 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Access Key
                </label>
                <input
                  type="text"
                  value={minioAccessKey}
                  onChange={(e) => setMinioAccessKey(e.target.value)}
                  placeholder="admin"
                  className="w-full p-3 bg-background border border-brand-border rounded text-foreground placeholder-brand-text/50 focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={minioSecretKey}
                  onChange={(e) => setMinioSecretKey(e.target.value)}
                  placeholder="minio123"
                  className="w-full p-3 bg-background border border-brand-border rounded text-foreground placeholder-brand-text/50 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border pt-6">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
            >
              {isLoading ? "Saving..." : "Save Settings"}
              {message?.type === "success" && !isLoading && <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 text-brand-text hover:text-white border border-brand-border hover:bg-brand-border transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
