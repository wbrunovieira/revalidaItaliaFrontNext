// /src/components/DocumentsSection.tsx
'use client';

import { useTranslations } from 'next-intl';
import {
  FileText,
  Download,
  File,
  Image,
  Archive,
  Video,
  Music,
  ExternalLink,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileAudio,
} from 'lucide-react';

interface DocumentTranslation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface Document {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  isDownloadable: boolean;
  lessonId: string;
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  locale: string;
}

// Function to get file icon based on MIME type or filename
function getFileIcon(mimeType: string, filename: string): JSX.Element {
  // Check if it's a PDF file
  const isPDF = (mimeType === 'application/pdf') || 
                (filename && filename.toLowerCase().endsWith('.pdf'));
  
  if (isPDF) {
    return (
      <img 
        src="/icons/pdf.svg" 
        alt="PDF" 
        className="w-8 h-8"
      />
    );
  }
  
  const iconProps = { size: 24, className: 'text-secondary' };
  
  // If mimeType is empty, determine from filename extension
  if (!mimeType && filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'doc':
      case 'docx':
        return <FileText {...iconProps} className="text-blue-400" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet {...iconProps} className="text-green-400" />;
      case 'ppt':
      case 'pptx':
        return <Presentation {...iconProps} className="text-orange-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <FileImage {...iconProps} className="text-purple-400" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'mkv':
        return <FileVideo {...iconProps} className="text-pink-400" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <FileAudio {...iconProps} className="text-yellow-400" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive {...iconProps} className="text-gray-400" />;
      case 'txt':
        return <FileText {...iconProps} className="text-gray-300" />;
      default:
        return <File {...iconProps} className="text-gray-400" />;
    }
  }
  
  // Handle MIME types
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText {...iconProps} className="text-blue-400" />;
  }
  
  if (mimeType.includes('sheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet {...iconProps} className="text-green-400" />;
  }
  
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <Presentation {...iconProps} className="text-orange-400" />;
  }
  
  if (mimeType.startsWith('image/')) {
    return <FileImage {...iconProps} className="text-purple-400" />;
  }
  
  if (mimeType.startsWith('video/')) {
    return <FileVideo {...iconProps} className="text-pink-400" />;
  }
  
  if (mimeType.startsWith('audio/')) {
    return <FileAudio {...iconProps} className="text-yellow-400" />;
  }
  
  if (mimeType === 'application/zip' || mimeType.includes('compressed')) {
    return <Archive {...iconProps} className="text-gray-400" />;
  }
  
  if (mimeType === 'text/plain') {
    return <FileText {...iconProps} className="text-gray-300" />;
  }
  
  return <File {...iconProps} className="text-gray-400" />;
}

// Function to format file size
function formatFileSize(bytes: number): string {
  // If fileSize is in MB (e.g., 5 for 5MB), convert to bytes
  if (bytes > 0 && bytes < 1000) {
    // Assume the value is in MB if it's a small number
    bytes = bytes * 1024 * 1024;
  }
  
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentsSection({ documents, locale }: DocumentsSectionProps) {
  const tLesson = useTranslations('Lesson');

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
        <FileText size={18} />
        {tLesson('documents')}
      </h4>
      <div className="space-y-3">
        {documents.map((document) => {
          const docTranslation = 
            document.translations.find(t => t.locale === locale) ||
            document.translations[0];
          
          return (
            <div
              key={document.id}
              className="group p-4 bg-primary/40 rounded-lg border border-secondary/30 hover:border-secondary/50 transition-all duration-200 cursor-pointer hover:bg-primary/60"
              onClick={() => window.open(docTranslation?.url, '_blank')}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-3 bg-primary/40 rounded-lg group-hover:bg-primary/60 transition-colors">
                  {getFileIcon(document.mimeType, document.filename)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-white group-hover:text-secondary transition-colors">
                        {docTranslation?.title || document.filename}
                      </h5>
                      <p className="text-sm text-gray-400 mt-1">
                        {document.filename}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(document.fileSize)}</span>
                      {document.isDownloadable && (
                        <Download size={14} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {docTranslation?.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {docTranslation.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {document.mimeType ? 
                        document.mimeType.split('/')[1]?.replace('vnd.', '').replace('application/', '') : 
                        document.filename.split('.').pop()?.toUpperCase()
                      }
                    </span>
                    
                    <button className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors">
                      <ExternalLink size={12} />
                      {tLesson('openDocument')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}