import { writeFile, unlink, access, mkdir } from 'fs/promises';
import path from 'path';
import { StorageAdapter, LocalStorageConfig } from './types';

export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private publicPath: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.publicPath = config.publicPath;
  }

  async save(file: File, filePath: string): Promise<string> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      return await this.saveBuffer(buffer, filePath);
    } catch (error) {
      console.error('LocalStorage save error:', error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveBuffer(buffer: Buffer, filePath: string): Promise<string> {
    try {
      // Construct full path
      const fullPath = path.join(process.cwd(), this.basePath, filePath);
      const directory = path.dirname(fullPath);

      console.log('LocalStorageAdapter - Saving file:', {
        filePath,
        fullPath,
        directory,
        basePath: this.basePath
      });

      // Ensure directory exists
      await this.ensureDirectory(directory);

      // Write file
      await writeFile(fullPath, buffer);
      
      console.log('LocalStorageAdapter - File saved successfully:', fullPath);

      // Return public URL
      return this.getUrl(filePath);
    } catch (error) {
      console.error('LocalStorage saveBuffer error:', error);
      throw new Error(`Failed to save buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), this.basePath, filePath);
      await unlink(fullPath);
      return true;
    } catch (error) {
      console.error('LocalStorage delete error:', error);
      return false;
    }
  }

  getUrl(filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `/${this.publicPath}/${cleanPath}`;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), this.basePath, filePath);
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectory(directory: string): Promise<void> {
    try {
      await access(directory);
    } catch {
      await mkdir(directory, { recursive: true });
    }
  }
}