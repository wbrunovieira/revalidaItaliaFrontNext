import { StorageAdapter, S3StorageConfig } from './types';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// S3 adapter for production use
export class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private region: string;
  private cdnUrl?: string;
  private s3Client: S3Client;
  
  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.cdnUrl = config.cdnUrl;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } : undefined, // Use default credentials (IAM role) if not specified
    });
  }

  async save(file: File, filePath: string): Promise<string> {
    try {
      // Convert File to Buffer for S3 upload
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
        // Add cache control for better performance
        CacheControl: 'max-age=31536000', // 1 year for static assets
      });
      
      await this.s3Client.send(command);
      console.log(`[S3] Successfully uploaded file to: s3://${this.bucket}/${filePath}`);
      
      // Return the full URL for the uploaded file
      return this.getUrl(filePath);
    } catch (error) {
      console.error('S3 save error:', error);
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveBuffer(buffer: Buffer, filePath: string, contentType?: string): Promise<string> {
    try {
      // Upload buffer to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        CacheControl: 'max-age=31536000',
      });
      
      await this.s3Client.send(command);
      console.log(`[S3] Successfully uploaded buffer to: s3://${this.bucket}/${filePath}`);
      
      return this.getUrl(filePath);
    } catch (error) {
      console.error('S3 saveBuffer error:', error);
      throw new Error(`Failed to upload buffer to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });
      
      await this.s3Client.send(command);
      console.log(`[S3] Successfully deleted: s3://${this.bucket}/${filePath}`);
      
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
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });
      
      await this.s3Client.send(command);
      console.log(`[S3] File exists: s3://${this.bucket}/${filePath}`);
      
      return true;
    } catch {
      return false;
    }
  }
}

// S3 adapter is now fully functional with AWS SDK v3