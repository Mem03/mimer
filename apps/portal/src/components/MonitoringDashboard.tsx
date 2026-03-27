"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Server, AlertTriangle, Bot, HardDrive } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type MetricItem = {
  name: string;
  usage: string;
  limit: string;
  trend_15m?: string;
  restarts?: number;
  cpu_throttled?: string;
  network_receive?: string;
};

type MetricsResponse = {
  type: string;
  metrics: MetricItem[];
};

const parseNumber = (str: string) => {
  if (!str || str === "Unlimited" || str === "Unknown" || str === "N/A" || str.includes("Unmeasured")) return 0;
  return parseFloat(str.replace(/[^0-9.-]+/g, ""));
};

// Helper to translate raw Kubernetes PVC names into Platform Engineering concepts
const getVolumePurpose = (pvcName: string) => {
  if (pvcName.includes("minio")) return "Lakehouse Object Store";
  if (pvcName.includes("claim-")) return "User Workspace (Jupyter)";
  if (pvcName.includes("hub-db")) return "JupyterHub System State";
  return "Unknown Allocation";
};

export default function MonitoringDashboard() {
  const [memoryData, setMemoryData] = useState<MetricItem[]>([]);
  const [storageData, setStorageData] = useState<MetricItem[]>([]);
  const [ephemeralData, setEphemeralData] = useState<MetricItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const fetchAPI = async (type: string) => {
          const res = await fetch(`http://localhost:8081/api/metrics?type=${type}`);
          if (!res.ok) throw new Error("Network response was not ok");
          const data: MetricsResponse = await res.json();
          return data.metrics || [];
        };

        const [mem, storage, ephemeral] = await Promise.all([
          fetchAPI("memory_pressure"),
          fetchAPI("storage_growth"),
          fetchAPI("ephemeral_storage"),
        ]);

        setMemoryData(mem);
        setStorageData(storage);
        setEphemeralData(ephemeral);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-500">
        <Activity className="w-10 h-10 animate-pulse text-blue-500 mb-4" />
        <span className="font-medium tracking-wide">Syncing with K8s Telemetry...</span>
      </div>
    );
  }

  const chartData = memoryData.map(m => {
    const usageNum = parseNumber(m.usage);
    const limitNum = parseNumber(m.limit);
    let statusColor = "#3B82F6"; 
    if (limitNum > 0) {
      const percent = usageNum / limitNum;
      if (percent > 0.9) statusColor = "#EF4444"; 
      else if (percent > 0.75) statusColor = "#F59E0B"; 
    }
    if ((m.restarts || 0) > 0) statusColor = "#EF4444"; 
    
    return {
      name: m.name.replace("jupyter-", "").replace("-", " "), 
      Usage: usageNum,
      Limit: limitNum,
      fill: statusColor
    };
  });

  const totalEphemeralKB = ephemeralData.reduce((acc, curr) => acc + parseNumber(curr.usage), 0);
  
  // Platform Engineer Metric: Calculate total provisioned hard drive space across the cluster
  const totalProvisionedStorageGB = storageData.reduce((acc, curr) => acc + parseNumber(curr.limit), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cluster Telemetry</h2>
          <p className="text-sm text-slate-500">Live data from VictoriaMetrics</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <Bot className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">AI Agent: Standby</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Server className="text-blue-500 w-5 h-5" />
            <h3 className="font-medium text-slate-800">Compute Pods</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{memoryData.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-amber-500 w-5 h-5" />
            <h3 className="font-medium text-slate-800">Restarts</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">
            {memoryData.reduce((acc, curr) => acc + (curr.restarts || 0), 0)}
          </p>
        </div>

        {/* Updated to show total GB capacity instead of just "3 PVCs" */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-purple-500 w-5 h-5" />
            <h3 className="font-medium text-slate-800">Persistent Storage</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{totalProvisionedStorageGB.toFixed(0)} GB</p>
          <p className="text-xs text-slate-500 mt-1">Across {storageData.length} volumes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="text-emerald-500 w-5 h-5" />
            <h3 className="font-medium text-slate-800">Ephemeral Used</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{totalEphemeralKB.toFixed(2)} KB</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col pt-4">
        <div className="px-5 pb-4 border-b border-slate-50">
          <h3 className="font-semibold text-slate-800">Memory Allocation (MB)</h3>
          <p className="text-xs text-slate-500 mt-1">Real-time working set bytes vs limit</p>
        </div>
        <div className="p-5 h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Bar dataKey="Usage" radius={[4, 4, 0, 0]} maxBarSize={80}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Active Compute Directory</h3>
          <p className="text-xs text-slate-500 mt-1">Detailed metrics for all running kernels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-medium">Pod Name</th>
                <th className="px-5 py-3 font-medium">Memory Usage</th>
                <th className="px-5 py-3 font-medium">Memory Limit</th>
                <th className="px-5 py-3 font-medium text-emerald-700 bg-emerald-50">Local Disk (Ephemeral)</th>
                <th className="px-5 py-3 font-medium">15m Velocity</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memoryData.map((pod) => {
                const podEphemeral = ephemeralData.find(e => e.name === pod.name)?.usage || "0.00 KB";
                return (
                  <tr key={pod.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{pod.name}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{pod.usage}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{pod.limit}</td>
                    <td className="px-5 py-4 font-mono font-medium text-emerald-600 bg-emerald-50/30">
                      {podEphemeral}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-mono px-2 py-1 rounded text-xs ${pod.trend_15m?.includes('-') ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {pod.trend_15m || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {(pod.restarts || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Crashing ({pod.restarts})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {memoryData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 italic">
                    No active compute pods found in the cluster.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Platform Engineer Storage Directory */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-800">Persistent Volume Directory</h3>
            <p className="text-xs text-slate-500 mt-1">Platform-level durability and capacity allocation</p>
          </div>
          <Database className="w-5 h-5 text-purple-500 opacity-50" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-medium">Volume Claim (PVC)</th>
                <th className="px-5 py-3 font-medium">Platform Purpose</th>
                <th className="px-5 py-3 font-medium text-purple-700 bg-purple-50">Live Usage</th>
                <th className="px-5 py-3 font-medium">Provisioned Capacity</th>
                <th className="px-5 py-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {storageData.map((vol) => (
                <tr key={vol.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-slate-800 text-xs">{vol.name}</td>
                  <td className="px-5 py-4 font-medium text-slate-700">{getVolumePurpose(vol.name)}</td>
                  
                  {/* Highlight Live Usage - Fallback cleanly if Minikube doesn't provide it */}
                  <td className="px-5 py-4 font-mono font-medium text-purple-700 bg-purple-50/30">
                    {vol.usage}
                  </td>
                  
                  <td className="px-5 py-4 font-mono text-slate-600">{vol.limit}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Bound
                    </span>
                  </td>
                </tr>
              ))}
              {storageData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 italic">
                    No persistent volumes detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}