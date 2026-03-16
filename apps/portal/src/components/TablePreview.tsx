"use client";

import { useEffect, useState } from "react";
import { initializeDuckDB, configureS3 } from "@/lib/duckdb";

// The "export" keyword here is what the error is complaining about!
export function TablePreview({ tableName, activeFiles }: { tableName: string, activeFiles: string[] }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1. Initialize the local WASM engine
        const db = await initializeDuckDB();
        
        // 2. Setup S3 credentials & HTTPFS extension
        await configureS3(db);
        
        const conn = await db.connect();

        let query;
        // 3. Adaptive Logic: Use the Delta Log's active files if available
        if (activeFiles && activeFiles.length > 0) {
          // Pass the array of strings directly to read_parquet
          query = `SELECT * FROM read_parquet(${JSON.stringify(activeFiles)}) LIMIT 20`;
        } else {
          // Fallback: Glob all parquet files in the folder
          const bucket = process.env.NEXT_PUBLIC_MINIO_DEFAULT_BUCKET || 'raw-data';
          query = `SELECT * FROM read_parquet('s3://${bucket}/${tableName}/**/*.parquet') LIMIT 20`;
        }

        // 4. Execute and transform results
        const result = await conn.query(query);
        setData(result.toArray().map(r => r.toJSON()));
        
        await conn.close();
      } catch (e: any) {
        console.error("DuckDB Preview Error:", e);
        setError(e.message || "Failed to load data preview.");
      } finally {
        setLoading(false);
      }
    }
    
    if (tableName) {
      load();
    }
    
    // We stringify the array so React can do a value-comparison 
    // instead of a reference-comparison.
  }, [tableName, JSON.stringify(activeFiles)]);

  if (loading) {
    return (
      <div className="p-8 border border-dashed border-brand-border rounded-lg flex flex-col items-center justify-center bg-brand-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-4"></div>
        <p className="text-sm text-brand-text font-medium">Booting DuckDB Wasm & fetching from MinIO...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Preview Error</h3>
        <p className="text-red-600 text-sm font-mono">{error}</p>
        <p className="mt-4 text-xs text-red-500 italic">Check if MinIO CORS is enabled and your NEXT_PUBLIC keys are correct.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-brand-surface border-b border-brand-border">
            <tr>
              {data.length > 0 && Object.keys(data[0]).map(k => (
                <th key={k} className="px-4 py-3 font-semibold text-brand-dark border-r border-brand-border last:border-0 whitespace-nowrap">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border font-mono text-[11px]">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-brand-surface transition-colors">
                {Object.values(row).map((v: any, j) => (
                  <td key={j} className="px-4 py-2 text-brand-text border-r border-brand-border last:border-0 truncate max-w-[200px]">
                    {v === null ? <span className="text-gray-300">null</span> : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-8 text-center text-brand-text italic">No data returned for this table.</div>
      )}
    </div>
  );
}