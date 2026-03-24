import * as duckdb from '@duckdb/duckdb-wasm';

// 1. Define a consistent version for the WASM bundles
const DUCKDB_VERSION = '1.28.0'; 
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/`;

// src/lib/duckdb.ts
import * as duckdb from '@duckdb/duckdb-wasm';

export async function initializeDuckDB() {
    const BUNDLES: duckdb.DuckDBBundles = {
        mvp: {
            mainModule: '/duckdb-mvp.wasm',
            mainWorker: '/duckdb-browser-mvp.worker.js',
        },
        eh: {
            mainModule: '/duckdb-eh.wasm',
            mainWorker: '/duckdb-browser-eh.worker.js',
        },
    };

    const bundle = await duckdb.selectBundle(BUNDLES);
    
    // This tells the browser: "The worker script is on my own server"
    const worker = new Worker(new URL(bundle.mainWorker!, window.location.origin));
    
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    return db;
}

// src/lib/duckdb.ts

export async function configureS3(db: duckdb.AsyncDuckDB) {
    const conn = await db.connect();
    try {
        await conn.query(`INSTALL httpfs; LOAD httpfs;`);
        
        // 1. Strip 'http://' from the URL. DuckDB wants just the endpoint.
        const rawUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'localhost:9000';
        const cleanEndpoint = rawUrl.replace('http://', '').replace('https://', '');

        // 2. Ensure SSL is a literal true/false for the SQL query
        const useSsl = process.env.NEXT_PUBLIC_MINIO_USE_SSL === 'true' ? 'true' : 'false';

        await conn.query(`
            CREATE SECRET (
                TYPE S3,
                KEY_ID '${process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY || 'admin'}',
                SECRET '${process.env.NEXT_PUBLIC_MINIO_SECRET_KEY || 'minio123'}',
                ENDPOINT '${cleanEndpoint}',
                URL_STYLE 'path',
                REGION 'us-east-1',
                USE_SSL ${useSsl}
            );
        `);
        console.log("DuckDB S3 Secret Configured");
    } catch (err) {
        console.error("DuckDB S3 Config Failed:", err);
    } finally {
        await conn.close();
    }
}