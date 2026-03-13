import { getComputeClusters } from "@/lib/k8s";
import Link from "next/link";
import { WORKSPACE_CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function ComputePage() {
  // Injecting the central namespace variable here fixes the crash!
  const clusters = await getComputeClusters(WORKSPACE_CONFIG.namespace);

  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-auto">
      <header className="mb-8 border-b border-brand-border pb-4">
        <h1 className="text-2xl font-semibold text-brand-dark">Compute Clusters</h1>
        <p className="text-sm text-brand-text mt-1">Monitor your active Spark and Jupyter instances in the {WORKSPACE_CONFIG.namespace} namespace</p>
      </header>

      <section className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="px-6 py-4 border-b border-brand-border bg-brand-surface flex items-center justify-between">
          <h2 className="text-sm font-medium text-brand-dark">
            Active Workspaces
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-text border border-brand-border px-2 py-1 rounded-md bg-white">
              {clusters.length} {clusters.length === 1 ? 'cluster' : 'clusters'} running
            </span>
            
            {/* Clean White/Black Button */}
            <Link href="/jupyter" className="bg-white border border-brand-border hover:bg-brand-surface text-brand-dark px-3 py-1 rounded-md text-sm font-medium transition-colors shadow-sm">
              + New Workspace
            </Link>
          </div>
        </div>

        {/* The Data Table */}
        {clusters.length === 0 ? (
          <div className="p-6 text-sm text-brand-text italic">No compute clusters are currently running.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-brand-border">
                <tr>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/4">Cluster Name</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/6">Status</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/6">Restarts</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/4">Started At</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {clusters.map((cluster) => (
                  <tr key={cluster.name} className="hover:bg-brand-surface transition-colors">
                    <td className="px-6 py-3">
                      <Link 
                        href={`/compute/${cluster.name}`}
                        className="font-medium text-brand-primary hover:text-brand-hover hover:underline transition-all block w-full"
                      >
                        {cluster.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        cluster.status === 'Running' ? 'bg-green-50 text-green-700 border border-green-200' :
                        cluster.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {cluster.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-brand-text">
                      {cluster.restarts}
                    </td>
                    <td className="px-6 py-3 text-brand-text">
                      {cluster.startedAt}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-red-600 hover:text-red-800 font-medium transition-colors">
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}