// src/lib/storage/index.ts
import { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local.adapter';
import { S3StorageAdapter } from './s3.adapter';

let storageInstance: StorageAdapter | null = null;

/**
 * Create and return a storage adapter based on the current environment
 */
export function createStorageAdapter(): StorageAdapter {
  // Use singleton pattern to avoid creating multiple instances
  if (storageInstance) {
    return storageInstance;
  }

  // Production environment - use S3
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.S3_BUCKET
  ) {
    console.log(
      '🚀 Using S3 Storage Adapter for production'
    );
    storageInstance = new S3StorageAdapter({
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      cdnUrl: process.env.CDN_URL,
    });
  } else {
    // Development environment - use local storage
    console.log(
      '💾 Using Local Storage Adapter for development'
    );
    storageInstance = new LocalStorageAdapter({
      basePath: 'public/uploads',
      publicPath: 'uploads',
    });
  }

  return storageInstance;
}

/**
 * Get the current storage adapter instance
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    return createStorageAdapter();
  }
  return storageInstance;
}

// Export types
export type { StorageAdapter, UploadResult } from './types';
