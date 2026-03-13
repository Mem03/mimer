import Link from "next/link";
import { getComputeDetails } from "@/lib/k8s";
import { WORKSPACE_CONFIG } from "@/lib/config";

export default async function ComputeDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const podName = decodeURIComponent(resolvedParams.name);
  
  // Use the central config! 
  // (Note: Make sure your getComputeDetails in k8s.ts accepts the namespace first or second, depending on how you wrote it. I'm passing it here.)
  const details = await getComputeDetails(WORKSPACE_CONFIG.namespace, podName);

  if (!details) {
    return <div className="p-8 text-sm text-brand-text">Compute resource not found or has been terminated.</div>;
  }

  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-auto">
      
      {/* Breadcrumbs */}
      <div className="mb-6 text-sm text-brand-text">
        <Link href="/compute" className="hover:text-brand-primary transition-colors">Compute Clusters</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-brand-dark">{podName}</span>
      </div>

      {/* Header Toolbar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark flex items-center gap-3">
            {podName}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              details.status === 'Running' ? 'bg-green-50 text-green-700 border-green-200' :
              details.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {details.status}
            </span>
          </h1>
          <p className="text-sm text-brand-text mt-1">
            Running on node: <span className="font-mono text-xs">{details.node}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/jupyter" className="bg-white border border-brand-border hover:bg-brand-surface text-brand-dark px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
            Open in Jupyter
          </Link>
          <button className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-red-200 shadow-sm">
            Terminate
          </button>
        </div>
      </header>

      {/* Hardware & Spec Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Hardware Allocation */}
        <div>
          <h2 className="text-sm font-semibold text-brand-dark mb-4 uppercase tracking-wide">Hardware Allocation</h2>
          <div className="bg-white border border-brand-border rounded-lg shadow-sm">
            <dl className="divide-y divide-brand-border text-sm">
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">CPU Limit</dt>
                <dd className="font-mono text-brand-dark">{details.cpuLimit}</dd>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">Memory Limit</dt>
                <dd className="font-mono text-brand-dark">{details.memoryLimit}</dd>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">Internal IP</dt>
                <dd className="font-mono text-brand-dark">{details.ip}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Software Environment */}
        <div>
          <h2 className="text-sm font-semibold text-brand-dark mb-4 uppercase tracking-wide">Software Environment</h2>
          <div className="bg-white border border-brand-border rounded-lg shadow-sm">
            <dl className="divide-y divide-brand-border text-sm">
              <div className="px-4 py-3 flex flex-col gap-1">
                <dt className="text-brand-text">Docker Image</dt>
                <dd className="font-mono text-xs text-brand-dark break-all bg-brand-surface p-2 rounded border border-brand-border mt-1">
                  {details.image}
                </dd>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">Started At</dt>
                <dd className="font-medium text-brand-dark">{details.startedAt}</dd>
              </div>
            </dl>
          </div>
        </div>

      </div>
    </div>
  );
}