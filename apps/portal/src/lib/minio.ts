// src/lib/minio.ts
import { 
  S3Client, 
  ListObjectsV2Command, 
  ListBucketsCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";


const s3Client = new S3Client({
  // Use the NEXT_PUBLIC_ prefix to match your Makefile/Next.js requirements
  endpoint: process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000",
  
  region: process.env.MINIO_REGION || "us-east-1", 
  
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY || "admin",
    secretAccessKey: process.env.NEXT_PUBLIC_MINIO_SECRET_KEY || "minio123",
  },
  
  // Convert the string from .env to a boolean for the SDK
  tls: process.env.NEXT_PUBLIC_MINIO_USE_SSL === "true", 

  forcePathStyle: true, 
});

export async function getFiles(bucketName: string) {
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error("Error fetching from MinIO:", error);
    return [];
  }
}

export async function getBuckets() {
  const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
  return Buckets || [];
}

export async function getTables(bucketName: string) {
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName, Delimiter: "/" });
    const response = await s3Client.send(command);

    if (!response.CommonPrefixes) return [];

    const validTables = [];

    for (const prefixObj of response.CommonPrefixes) {
      const prefix = prefixObj.Prefix;
      if (!prefix) continue;

      const checkCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });

      const checkResponse = await s3Client.send(checkCommand);
      const realFiles = checkResponse.Contents?.filter(f => f.Key !== prefix) || [];

      if (realFiles.length > 0) {
        // 1. Calculate total size
        const totalSizeBytes = realFiles.reduce((sum, file) => sum + (file.Size || 0), 0);
        const sizeFormatted = totalSizeBytes > 1024 * 1024
          ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${(totalSizeBytes / 1024).toFixed(2)} KB`;

        // 2. Find the most recent update time
        const latestDate = realFiles.reduce((latest, file) => {
          if (!file.LastModified) return latest;
          if (!latest) return file.LastModified;
          return file.LastModified > latest ? file.LastModified : latest;
        }, null as Date | null);

        // 3. Push the complete object
        validTables.push({
          name: prefix.replace("/", ""),
          size: sizeFormatted,
          updatedAt: latestDate ? latestDate.toLocaleString() : "-",
        });
      }
    }

    return validTables;
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
}

export async function getTableDetails(bucketName: string, tableName: string) {
  try {
    // Look for all files inside the specific table's folder
    const command = new ListObjectsV2Command({ 
      Bucket: bucketName,
      Prefix: `${tableName}/` 
    });
    const response = await s3Client.send(command);
    const files = response.Contents || [];

    // Calculate metadata
    const totalSizeBytes = files.reduce((sum, file) => sum + (file.Size || 0), 0);
    const fileCount = files.length;
    
    // If it has a _delta_log folder, it's a Delta Table! Otherwise, raw Parquet.
    const isDelta = files.some(f => f.Key?.includes('_delta_log/'));
    const format = isDelta ? "Delta Lake" : "Parquet";

    // Format size to MB/KB for humans
    const sizeFormatted = totalSizeBytes > 1024 * 1024 
      ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalSizeBytes / 1024).toFixed(2)} KB`;

    return { 
      files, 
      sizeFormatted, 
      fileCount, 
      format,
      lastUpdated: files.length > 0 ? files[0].LastModified : null
    };
  } catch (error) {
    console.error(`Error fetching details for ${tableName}:`, error);
    return null;
  }
}

export async function deleteTable(bucketName: string, tableName: string) {
  try {
    const listCommand = new ListObjectsV2Command({ 
      Bucket: bucketName, 
      // ADD THE SLASH BACK! This makes sure we only delete this exact folder
      Prefix: `${tableName}/` 
    });
    
    // Cleaned up the execution so it runs perfectly
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) return;

    await Promise.all(
      response.Contents.map((file) => {
        if (!file.Key) return Promise.resolve();
        return s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        }));
      })
    );

    console.log(`Successfully deleted table: ${tableName}`);
  } catch (error) {
    console.error(`Error deleting table ${tableName}:`, error);
    throw new Error("Failed to delete table");
  }
}

export async function getDeltaActiveFiles(bucketName: string, tableName: string) {
  try {
    const command = new ListObjectsV2Command({ 
      Bucket: bucketName, 
      Prefix: `${tableName}/_delta_log/`,
    });
    const response = await s3Client.send(command);
    const logFiles = response.Contents?.filter(f => f.Key?.endsWith('.json')) || [];
    
    // Sort to get the latest logs
    logFiles.sort((a, b) => (a.Key! > b.Key! ? 1 : -1));

    const activeFiles = new Set<string>();

    for (const log of logFiles) {
      const getObj = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: log.Key
      }));
      const body = await getObj.Body?.transformToString();
      if (!body) continue;

      // Delta logs are JSONL (one JSON object per line)
      const lines = body.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const entry = JSON.parse(line);
        if (entry.add) activeFiles.add(entry.add.path);
        if (entry.remove) activeFiles.delete(entry.remove.path);
      }
    }

    return Array.from(activeFiles).map(path => `s3://${bucketName}/${tableName}/${path}`);
  } catch (error) {
    console.error("Error parsing Delta log:", error);
    return [];
  }
}

export async function vacuumTable(bucketName: string, tableName: string) {
  // 1. Get all physical files in the folder
  const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: `${tableName}/` });
  const listResponse = await s3Client.send(listCommand);
  const allPhysicalFiles = listResponse.Contents?.map(f => f.Key!) || [];

  // 2. Get the active files (the ones the Delta log says we need)
  const activeFilesFullPaths = await getDeltaActiveFiles(bucketName, tableName);
  const activeKeys = new Set(activeFilesFullPaths.map(path => path.replace(`s3://${bucketName}/`, '')));

  // 3. Identify files to delete (Physical files not in log and not active)
  const filesToDelete = allPhysicalFiles.filter(key => {
    const isLog = key.includes('_delta_log');
    const isActive = activeKeys.has(key);
    return !isLog && !isActive;
  });

  if (filesToDelete.length === 0) return { deletedCount: 0 };

  // 4. Delete one-by-one to avoid Content-MD5 header issues
  // We use Promise.all to run them in parallel for speed
  await Promise.all(
    filesToDelete.map((key) =>
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      )
    )
  );

  return { deletedCount: filesToDelete.length };
}