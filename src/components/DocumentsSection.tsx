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
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  locale: string;
}

// Function to get file icon based on filename
function getFileIcon(filename: string): JSX.Element {
  // Check if it's a PDF file
  const isPDF = filename && filename.toLowerCase().endsWith('.pdf');
  
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
  
  // Determine icon from filename extension
  if (filename) {
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
  
  return <File {...iconProps} className="text-gray-400" />;
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
      <div className="space-y-2">
        {documents.map((document, index) => {
          const docTranslation = 
            document.translations.find(t => t.locale === locale) ||
            document.translations[0];
          
          return (
            <div
              key={document.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="relative flex items-center gap-3 p-3 bg-primary/40 rounded-lg border border-secondary/30 transition-all duration-300 cursor-pointer overflow-hidden
                  hover:bg-primary/60 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-x-1"
                onClick={() => window.open(docTranslation?.url, '_blank')}
              >
                {/* Animated background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                
                {/* Icon with rotation animation */}
                <div className="relative flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {getFileIcon(document.filename)}
                </div>
                
                {/* Title with underline animation */}
                <div className="relative flex-1 min-w-0">
                  <h5 className="font-medium text-white group-hover:text-secondary transition-colors duration-300 truncate">
                    {docTranslation?.title || document.filename}
                  </h5>
                  <div className="absolute bottom-0 left-0 h-0.5 bg-secondary w-0 group-hover:w-full transition-all duration-300 ease-out" />
                </div>
                
                {/* Arrow icon with slide animation */}
                <div className="relative flex items-center gap-2">
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {tLesson('openDocument')}
                  </span>
                  <ExternalLink 
                    size={16} 
                    className="text-gray-400 group-hover:text-secondary transform transition-all duration-300 group-hover:translate-x-1" 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}