"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Server, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

type MetricAction = { action: string };
type MetricItem = {
  name: string;
  value: string;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  actions: MetricAction[];
};
type MetricsResponse = {
  type: string;
  metrics: MetricItem[];
};

export default function MonitoringDashboard() {
  const [memoryPressure, setMemoryPressure] = useState<MetricItem[]>([]);
  const [storageGrowth, setStorageGrowth] = useState<MetricItem[]>([]);
  const [efficiency, setEfficiency] = useState<MetricItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const fetchAPI = async (type: string) => {
          const res = await fetch(`http://localhost:8081/api/metrics?type=${type}`);
          const data: MetricsResponse = await res.json();
          return data.metrics;
        };

        const [mem, storage, eff] = await Promise.all([
          fetchAPI("memory_pressure"),
          fetchAPI("storage_growth"),
          fetchAPI("efficiency"),
        ]);

        setMemoryPressure(mem);
        setStorageGrowth(storage);
        setEfficiency(eff);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-brand-text">
        <Activity className="w-8 h-8 animate-pulse text-brand-primary" />
        <span className="ml-3 font-medium tracking-wide">Gathering telemetry...</span>
      </div>
    );
  }

  // Formatting for Recharts
  const chartData = memoryPressure.map(m => ({
    name: m.name.replace("jupyter-mimer-user-", ""),
    usage: Number(m.value.replace("%", "")),
    status: m.status
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Memory Pressure Overview */}
        <div className="bg-white/40 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm transform transition hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center gap-3 mb-2">
            <Server className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <h3 className="font-medium text-brand-dark">Compute Stress</h3>
          </div>
          <p className="text-3xl font-semibold text-brand-dark mt-2">
            {memoryPressure.filter(m => m.status !== "HEALTHY").length}
          </p>
          <p className="text-xs text-brand-text mt-1">Pods requiring attention</p>
        </div>

        {/* Storage Growth Overview */}
        <div className="bg-white/40 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm transform transition hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-blue-500 w-5 h-5 flex-shrink-0" />
            <h3 className="font-medium text-brand-dark">Storage Growth</h3>
          </div>
          <p className="text-3xl font-semibold text-brand-dark mt-2">
            {storageGrowth[0]?.value || "0GB"}
          </p>
          <p className="text-xs text-brand-text mt-1">Total capacity mapped</p>
        </div>

        {/* Efficiency Overview */}
        <div className="bg-white/40 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm transform transition hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-green-500 w-5 h-5 flex-shrink-0" />
            <h3 className="font-medium text-brand-dark">Cluster Efficiency</h3>
          </div>
          <p className="text-3xl font-semibold text-brand-dark mt-2">
            {efficiency[0]?.value || "100%"}
          </p>
          <p className="text-xs text-brand-text mt-1">Allocated vs Actual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart View */}
        <div className="bg-white border border-brand-border rounded-xl shadow-sm flex flex-col pt-4">
          <div className="px-5 pb-4">
            <h3 className="font-semibold text-brand-dark">Memory Pressure by Pod</h3>
            <p className="text-xs text-brand-text mt-1">Real-time working set bytes vs limit</p>
          </div>
          <div className="p-5 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="3 3" />
                <ReferenceLine y={95} stroke="#EF4444" strokeDasharray="3 3" />
                <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'CRITICAL' ? '#EF4444' : entry.status === 'WARNING' ? '#F59E0B' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Agent Actionable Suggestions */}
        <div className="bg-white border border-brand-border rounded-xl shadow-sm flex flex-col pt-4">
          <div className="px-5 pb-4">
            <h3 className="font-semibold text-brand-dark">AI Orchestrator Advisory</h3>
            <p className="text-xs text-brand-text mt-1">Automatically mapped actions from the Metrics API</p>
          </div>
          <div className="p-0 overflow-y-auto flex-1 max-h-[350px]">
            <ul className="divide-y divide-brand-border">
              {[...memoryPressure, ...storageGrowth, ...efficiency].filter(m => m.actions && m.actions.length > 0).map((metric, idx) => (
                <li key={idx} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {metric.status === 'CRITICAL' ? (
                        <AlertTriangle className="text-red-500 w-4 h-4" />
                      ) : metric.status === 'WARNING' ? (
                        <Info className="text-amber-500 w-4 h-4" />
                      ) : (
                        <CheckCircle className="text-green-500 w-4 h-4" />
                      )}
                      <span className="font-medium text-sm text-brand-dark">{metric.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      metric.status === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                      metric.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {metric.actions.map((act, i) => (
                      <div key={i} className="flex gap-2 text-sm text-brand-text items-center bg-white border border-slate-200 shadow-sm rounded px-3 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block flex-shrink-0"></span>
                        {act.action}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
