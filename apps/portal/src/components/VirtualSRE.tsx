// apps/portal/src/components/VirtualSRE.tsx
"use client";

import { useState, useEffect } from 'react';

interface MetricItem {
  name: string;
  usage: string;
  limit: string;
  trend_15m: string;
  restarts: number;
  cpu_throttled: string;
  network_receive: string;
}

interface MetricsResponse {
  type: string;
  metrics: MetricItem[];
}

export default function VirtualSRE() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSRE = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_METRICS_API_URL}/api/metrics?type=sre`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data: MetricsResponse = await res.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch SRE status", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSRE();
    const interval = setInterval(fetchSRE, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 border border-blue-500 rounded-lg bg-slate-900 text-white mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="animate-pulse h-3 w-3 bg-green-500 rounded-full"></span>
          AI Orchestrator: Virtual SRE
        </h3>
        <p className="mt-2 text-gray-400 font-mono text-sm animate-pulse">Loading SRE metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500 rounded-lg bg-slate-900 text-white mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="h-3 w-3 bg-red-500 rounded-full"></span>
          AI Orchestrator: Virtual SRE
        </h3>
        <p className="mt-2 text-red-400 font-mono text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!metrics || metrics.metrics.length === 0) {
    return (
      <div className="p-4 border border-blue-500 rounded-lg bg-slate-900 text-white mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="animate-pulse h-3 w-3 bg-yellow-500 rounded-full"></span>
          AI Orchestrator: Virtual SRE
        </h3>
        <p className="mt-2 text-gray-400 font-mono text-sm">No SRE metrics available</p>
      </div>
    );
  }

  // Sort metrics by name for consistent ordering
  const sortedMetrics = [...metrics.metrics].sort((a, b) => a.name.localeCompare(b.name));
  const displayCount = expanded ? sortedMetrics.length : 2;
  const visibleMetrics = sortedMetrics.slice(0, displayCount);

  // Determine overall worst status for indicator
  const worstStatus = sortedMetrics.reduce((worst, m) => {
    if (m.cpu_throttled === "Yes" || m.restarts > 0) return "Critical";
    if (m.usage.includes("Degraded") || worst === "Degraded") return "Degraded";
    return worst;
  }, "Healthy" as "Healthy" | "Degraded" | "Critical");

  const statusColor = worstStatus === "Critical" ? "bg-red-500" :
                     worstStatus === "Degraded" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="p-4 border border-blue-500 rounded-lg bg-slate-900 text-white mb-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <span className={`h-3 w-3 ${statusColor} rounded-full animate-pulse`}></span>
        AI Orchestrator: Virtual SRE
      </h3>
      
      <div className="mt-3 space-y-2">
        {visibleMetrics.map((metric) => (
          <div key={metric.name} className="p-3 bg-slate-800 rounded-lg text-sm">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-blue-300">{metric.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                metric.cpu_throttled === "Yes" ? "bg-red-900 text-red-300" :
                metric.usage.includes("Degraded") || metric.restarts > 0 ? "bg-yellow-900 text-yellow-300" :
                "bg-green-900 text-green-300"
              }`}>
                {metric.usage}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
              <div><span className="text-gray-500">Limit:</span> {metric.limit}</div>
              <div><span className="text-gray-500">Trend (15m):</span> {metric.trend_15m}</div>
              <div><span className="text-gray-500">Restarts:</span> {metric.restarts}</div>
              <div><span className="text-gray-500">CPU Throttled:</span> {metric.cpu_throttled}</div>
              <div><span className="text-gray-500">Network:</span> {metric.network_receive}</div>
            </div>
          </div>
        ))}
        {sortedMetrics.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            {expanded ? "▲ Show less" : `▼ Show all (${sortedMetrics.length} pods)`}
          </button>
        )}
      </div>
      
      <p className="mt-3 text-xs text-gray-500">
        Type: {metrics.type} | Updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
