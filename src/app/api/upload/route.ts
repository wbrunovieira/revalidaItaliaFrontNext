// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

// Allowed file types by category
const ALLOWED_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  attachment: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/ogg',
  ],
};

// Max file sizes by category (in bytes)
const MAX_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  attachment: 10 * 1024 * 1024, // 10MB
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category =
      (formData.get('category') as string) || 'image';
    const folder = (formData.get('folder') as string) || '';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate category
    if (
      !ALLOWED_TYPES[category as keyof typeof ALLOWED_TYPES]
    ) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes =
      ALLOWED_TYPES[category as keyof typeof ALLOWED_TYPES];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${allowedTypes.join(
            ', '
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize =
      MAX_SIZES[category as keyof typeof MAX_SIZES];
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${
            maxSize / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8);
    const extension = file.name.split('.').pop() || 'bin';
    const nameWithoutExt = file.name.replace(
      /\.[^/.]+$/,
      ''
    );
    const sanitizedName = nameWithoutExt.replace(
      /[^a-zA-Z0-9-_]/g,
      '-'
    );
    const uniqueFilename = `${sanitizedName}-${timestamp}-${randomString}.${extension}`;

    // Construct path
    const path = folder
      ? `${category}s/${folder}/${uniqueFilename}`
      : `${category}s/${uniqueFilename}`;

    // Get storage adapter and save file
    const storage = getStorage();
    const url = await storage.save(file, path);

    return NextResponse.json({
      success: true,
      url,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE method for file removal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'No path provided' },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const success = await storage.delete(path);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
