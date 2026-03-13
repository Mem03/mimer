import { getTables } from "@/lib/minio";
import Link from "next/link";
import { WORKSPACE_CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

// Notice how we can rename the component itself for better debugging!
export default async function CatalogHomePage() {
  const tables = await getTables(WORKSPACE_CONFIG.bucket);

  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-auto">
      <header className="mb-8 border-b border-brand-border pb-4">
        <h1 className="text-2xl font-semibold text-brand-dark">Data Catalog</h1>
        <p className="text-sm text-brand-text mt-1">Browse and manage your Lakehouse tables</p>
      </header>

      <section className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="px-6 py-4 border-b border-brand-border bg-brand-surface flex items-center justify-between">
          <h2 className="text-sm font-medium text-brand-dark">
            Database: {WORKSPACE_CONFIG.bucket}
          </h2>
          <span className="text-xs text-brand-text border border-brand-border px-2 py-1 rounded-md bg-white">
            {tables.length} {tables.length === 1 ? 'table' : 'tables'}
          </span>
        </div>

        {/* The Data Table */}
        {tables.length === 0 ? (
          <div className="p-6 text-sm text-brand-text italic">No tables found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-brand-border">
                <tr>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/2">Table Name</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/4">Size</th>
                  <th className="px-6 py-3 font-medium text-brand-text w-1/4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {tables.map((table) => (
                  <tr key={table.name} className="hover:bg-brand-surface transition-colors group">
                    <td className="px-6 py-3">
                      <Link 
                        href={`/table/${table.name}`}
                        className="font-medium text-brand-primary group-hover:text-brand-hover group-hover:underline transition-all block w-full"
                      >
                        {table.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-brand-text">
                      {table.size}
                    </td>
                    <td className="px-6 py-3 text-brand-text">
                      {table.updatedAt}
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