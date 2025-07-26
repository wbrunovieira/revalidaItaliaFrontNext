import { StorageAdapter, S3StorageConfig } from './types';

// S3 adapter for production use
// Note: This requires AWS SDK to be installed in production
export class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private region: string;
  private cdnUrl?: string;
  
  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.cdnUrl = config.cdnUrl;
  }

  async save(file: File, filePath: string): Promise<string> {
    try {
      // In production, this would use AWS SDK v3
      // For now, we'll implement a placeholder that shows the structure
      
      // Example implementation:
      // const client = new S3Client({ region: this.region });
      // const command = new PutObjectCommand({
      //   Bucket: this.bucket,
      //   Key: filePath,
      //   Body: Buffer.from(await file.arrayBuffer()),
      //   ContentType: file.type,
      // });
      // await client.send(command);
      
      // For development, just return the expected URL
      console.log(`[S3] Would upload file to: s3://${this.bucket}/${filePath}`);
      return this.getUrl(filePath);
    } catch (error) {
      console.error('S3 save error:', error);
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveBuffer(buffer: Buffer, filePath: string): Promise<string> {
    try {
      // Similar to save, but with buffer
      console.log(`[S3] Would upload buffer to: s3://${this.bucket}/${filePath}`);
      return this.getUrl(filePath);
    } catch (error) {
      console.error('S3 saveBuffer error:', error);
      throw new Error(`Failed to upload buffer to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      // const client = new S3Client({ region: this.region });
      // const command = new DeleteObjectCommand({
      //   Bucket: this.bucket,
      //   Key: filePath,
      // });
      // await client.send(command);
      
      console.log(`[S3] Would delete: s3://${this.bucket}/${filePath}`);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  getUrl(filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    if (this.cdnUrl) {
      // Use CDN URL if configured (CloudFront)
      return `${this.cdnUrl}/${cleanPath}`;
    }
    
    // Direct S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${cleanPath}`;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      // const client = new S3Client({ region: this.region });
      // const command = new HeadObjectCommand({
      //   Bucket: this.bucket,
      //   Key: filePath,
      // });
      // await client.send(command);
      
      console.log(`[S3] Would check existence: s3://${this.bucket}/${filePath}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Helper to install AWS SDK when needed
export const S3_SETUP_INSTRUCTIONS = `
To use S3 storage in production, install AWS SDK:

npm install @aws-sdk/client-s3

Then uncomment the AWS SDK code in s3.adapter.ts
`;