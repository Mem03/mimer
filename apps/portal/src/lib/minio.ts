// src/lib/minio.ts
import { 
  S3Client, 
  ListObjectsV2Command, 
  ListBucketsCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";


const s3Client = new S3Client({
  // 1. Hard fallback to localhost if the env var is missing
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  
  // 2. Force us-east-1. MinIO requires this by default locally
  region: process.env.MINIO_REGION || "us-east-1", 
  
  credentials: {
    // 3. Fallbacks for credentials too
    accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minio123",
  },
  
  // 4. Critical for MinIO! Without this, it tries to route to bucket-name.localhost:9000
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