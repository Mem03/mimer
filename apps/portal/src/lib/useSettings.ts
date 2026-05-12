"use client";

import { useState, useEffect } from "react";

interface AppSettings {
  githubToken: string;
  minioEndpoint: string;
  minioAccessKey: string;
  minioSecretKey: string;
  codeApiUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  githubToken: "",
  minioEndpoint: "localhost:9000",
  minioAccessKey: "admin",
  minioSecretKey: "minio123",
  codeApiUrl: "http://localhost:8082",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load from localStorage synchronously on first render
    const saved = localStorage.getItem("mimer-settings");
    let loadedSettings = { ...DEFAULT_SETTINGS };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    
    // Override with env vars if available
    if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
      loadedSettings.githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    }
    if (process.env.NEXT_PUBLIC_CODE_API_URL) {
      loadedSettings.codeApiUrl = process.env.NEXT_PUBLIC_CODE_API_URL;
    }
    if (process.env.NEXT_PUBLIC_MINIO_URL) {
      loadedSettings.minioEndpoint = process.env.NEXT_PUBLIC_MINIO_URL;
    }
    if (process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY) {
      loadedSettings.minioAccessKey = process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY;
    }
    if (process.env.NEXT_PUBLIC_MINIO_SECRET_KEY) {
      loadedSettings.minioSecretKey = process.env.NEXT_PUBLIC_MINIO_SECRET_KEY;
    }
    
    return loadedSettings;
  });
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    // Listen for storage changes (when settings are saved from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mimer-settings") {
        const saved = localStorage.getItem("mimer-settings");
        let loadedSettings = { ...DEFAULT_SETTINGS };
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
          } catch (e) {
            console.error("Failed to parse settings:", e);
          }
        }
        setSettings(loadedSettings);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("mimer-settings", JSON.stringify(updated));
  };

  return { settings, updateSettings, isLoaded };
}
