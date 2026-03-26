import MonitoringDashboard from "@/components/MonitoringDashboard";

export const dynamic = "force-dynamic";

export default function MonitoringPage() {
  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-auto">
      <header className="mb-8 border-b border-brand-border pb-4">
        <h1 className="text-2xl font-semibold text-brand-dark">Platform Health & Monitoring</h1>
        <p className="text-sm text-brand-text mt-1">
          Real-time metrics, capacity planning, and efficiency analysis powered by AI-Orchestrator endpoints.
        </p>
      </header>
      
      <MonitoringDashboard />
    </div>
  );
}
