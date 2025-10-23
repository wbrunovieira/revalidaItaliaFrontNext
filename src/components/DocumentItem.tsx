// /src/components/DocumentItem.tsx
'use client';

import { useCachedDocumentUrl } from '@/hooks/queries/useDocumentAccess';
import type { ProtectionLevel } from '@/hooks/queries/useDocumentStatus';
import { ExternalLink, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import {
  FileText,
  File,
  Archive,
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
  protectionLevel?: ProtectionLevel;
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentItemProps {
  document: Document;
  translation: DocumentTranslation;
  lessonId: string;
  isLoading: boolean;
  onDocumentClick: (document: Document, translation: DocumentTranslation) => void;
  openDocumentText: string;
  index: number;
}

// Function to get file icon based on filename
function getFileIcon(filename: string): React.ReactElement {
  const extension = filename?.split('.').pop()?.toLowerCase();

  // Check if it's a PDF file
  if (extension === 'pdf') {
    return (
      <Image
        src="/icons/pdf.svg"
        alt="PDF"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's a Word file
  if (extension === 'doc' || extension === 'docx') {
    return (
      <Image
        src="/icons/word.svg"
        alt="Word"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's an Excel file
  if (extension === 'xls' || extension === 'xlsx') {
    return (
      <Image
        src="/icons/excel.svg"
        alt="Excel"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's a PowerPoint file
  if (extension === 'ppt' || extension === 'pptx') {
    return (
      <Image
        src="/icons/powerpoint.svg"
        alt="PowerPoint"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Fallback to lucide icons
  switch (extension) {
    case 'ppt':
    case 'pptx':
      return <Presentation size={24} className="text-orange-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={24} className="text-blue-400" />;
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'webm':
      return <FileVideo size={24} className="text-purple-400" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'aac':
      return <FileAudio size={24} className="text-yellow-400" />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <Archive size={24} className="text-gray-400" />;
    case 'txt':
      return <FileText size={24} className="text-gray-300" />;
    default:
      return <File size={24} className="text-gray-400" />;
  }
}

export default function DocumentItem({
  document,
  translation,
  lessonId,
  isLoading,
  onDocumentClick,
  openDocumentText,
  index,
}: DocumentItemProps) {
  const protectionLevel = document.protectionLevel || 'NONE';

  // Check if this document has a cached URL
  const cachedDoc = useCachedDocumentUrl(lessonId, document.id);
  const hasCachedUrl = cachedDoc.hasCachedUrl;

  return (
    <div
      key={document.id}
      className="group relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`relative flex items-center gap-3 p-3 bg-primary/40 rounded-lg border border-secondary/30 transition-all duration-300 overflow-hidden
          ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-primary/60 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-x-1 hover:py-4'}`}
        onClick={() => !isLoading && onDocumentClick(document, translation)}
      >
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />

        {/* Icon with rotation animation */}
        <div className="relative flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          {isLoading ? (
            <Loader2 size={24} className="animate-spin text-secondary" />
          ) : (
            getFileIcon(document.filename)
          )}
        </div>

        {/* Title with underline animation and description */}
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-white group-hover:text-secondary transition-colors duration-300 truncate">
              {translation?.title || document.filename}
            </h5>
            {hasCachedUrl && protectionLevel !== 'NONE' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded text-xs text-green-400 border border-green-500/30">
                <span>⚡ CACHED</span>
              </div>
            )}
            {protectionLevel === 'FULL' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded text-xs text-red-400 border border-red-500/30">
                <Shield size={10} />
                <span>FULL</span>
              </div>
            )}
            {protectionLevel === 'WATERMARK' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-400 border border-blue-500/30">
                <Shield size={10} />
                <span>WATERMARK</span>
              </div>
            )}
          </div>
          {/* Description that appears on hover */}
          <p className="text-xs text-gray-400 mt-0.5 truncate max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300 ease-out">
            {translation?.description}
          </p>
          <div className="absolute bottom-0 left-0 h-0.5 bg-secondary w-0 group-hover:w-full transition-all duration-300 ease-out" />
        </div>

        {/* Arrow icon with slide animation */}
        <div className="relative flex items-center gap-2">
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {hasCachedUrl && protectionLevel !== 'NONE' ? 'Abrir (cache)' : openDocumentText}
          </span>
          <ExternalLink
            size={16}
            className="text-gray-400 group-hover:text-secondary transform transition-all duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </div>
  );
}
