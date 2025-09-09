// Storage adapter interface
export interface StorageAdapter {
  /**
   * Save a file to storage
   * @param file - The file to save
   * @param path - The path where to save (e.g., "images/courses/filename.jpg")
   * @returns The public URL of the saved file
   */
  save(file: File, path: string): Promise<string>;
  
  /**
   * Save a file from buffer
   * @param buffer - The file buffer
   * @param path - The path where to save
   * @param contentType - Optional MIME type for the file
   * @returns The public URL of the saved file
   */
  saveBuffer(buffer: Buffer, path: string, contentType?: string): Promise<string>;
  
  /**
   * Delete a file from storage
   * @param path - The path of the file to delete
   * @returns Success status
   */
  delete(path: string): Promise<boolean>;
  
  /**
   * Get the public URL for a file
   * @param path - The file path
   * @returns The public URL
   */
  getUrl(path: string): string;
  
  /**
   * Check if a file exists
   * @param path - The file path
   * @returns Whether the file exists
   */
  exists(path: string): Promise<boolean>;
}

// Configuration types
export interface LocalStorageConfig {
  basePath: string;
  publicPath: string;
}

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  cdnUrl?: string;
}

// Upload result
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}