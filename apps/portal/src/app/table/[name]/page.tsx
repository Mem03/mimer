import Link from "next/link";
import { getTableDetails, deleteTable } from "@/lib/minio";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import TableActionsMenu from "./TableActionsMenu";
import { WORKSPACE_CONFIG } from "@/lib/config";


export default async function TablePage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const tableName = decodeURIComponent(resolvedParams.name);
  
  // Using the strict variable
  const details = await getTableDetails(WORKSPACE_CONFIG.bucket, tableName);

  if (!details || details.fileCount === 0) {
    return <div className="p-8 text-sm text-brand-text">Table not found or is empty.</div>;
  }

  async function handleDelete() {
    "use server";
    // Using the strict variable
    await deleteTable(WORKSPACE_CONFIG.bucket, tableName);
    revalidatePath("/", "layout");
    redirect("/"); 
  }

  return (
    <div className="p-8 w-full max-w-6xl mx-auto h-full overflow-auto">
      
      {/* Breadcrumbs */}
      <div className="mb-6 text-sm text-brand-text">
        <Link href="/" className="hover:text-brand-primary transition-colors">Data Catalog</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-brand-dark">{tableName}</span>
      </div>

      {/* Header Toolbar */}
      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark">{tableName}</h1>
          <p className="text-sm text-brand-text mt-1">
            {WORKSPACE_CONFIG.bucket} bucket • {details.format} format
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <TableActionsMenu deleteAction={handleDelete} />
        </div>
      </header>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Property List (Metadata) */}
        <div className="md:col-span-1">
          <h2 className="text-sm font-semibold text-brand-dark mb-4 uppercase tracking-wide">Properties</h2>
          <div className="bg-white border border-brand-border rounded-lg shadow-sm">
            <dl className="divide-y divide-brand-border text-sm">
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">Format</dt>
                <dd className="font-medium text-brand-dark">{details.format}</dd>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">Total Size</dt>
                <dd className="font-medium text-brand-dark">{details.sizeFormatted}</dd>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <dt className="text-brand-text">File Count</dt>
                <dd className="font-medium text-brand-dark">{details.fileCount}</dd>
              </div>
              <div className="px-4 py-3 flex flex-col gap-1">
                <dt className="text-brand-text">Last Modified</dt>
                <dd className="font-medium text-brand-dark">
                  {details.lastUpdated?.toLocaleString() || "Unknown"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Physical Files Table */}
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-brand-dark mb-4 uppercase tracking-wide">Physical Files</h2>
          <div className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-surface border-b border-brand-border sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium text-brand-text">File Path</th>
                  <th className="px-4 py-3 font-medium text-brand-text text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border font-mono text-xs">
                {details.files.map((file) => (
                  <tr key={file.Key} className="hover:bg-brand-surface transition-colors">
                    <td className="px-4 py-3 truncate max-w-[200px] md:max-w-md text-brand-text" title={file.Key}>
                      {file.Key?.replace(`${tableName}/`, '')}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-text">
                      {(file.Size! / 1024).toFixed(1)} KB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}