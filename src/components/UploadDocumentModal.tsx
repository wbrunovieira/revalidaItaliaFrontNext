// /src/components/UploadDocumentModal.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Plus,
  User,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: ((document: UploadedDocument) => void) | (() => void);
  studentId?: string;
  studentName?: string;
}

export interface UploadedDocument {
  id: string;
  studentId: string;
  name: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de arquivo suportados
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const SUPPORTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  studentName,
}: UploadDocumentModalProps) {
  const t = useTranslations('Profile.documents');
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form
  const resetForm = useCallback(() => {
    setFile(null);
    setName('');
    setDescription('');
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  }, [isUploading, resetForm, onClose]);

  // Get file icon based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon size={24} className="text-blue-400" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet size={24} className="text-green-400" />;
    }
    return <FileText size={24} className="text-secondary" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return t('upload.unsupportedType');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('upload.fileTooLarge');
    }
    return null;
  }, [t]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Auto-fill name from filename if empty
    if (!name) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileName);
    }
  }, [name, validateFile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!file || !name.trim() || !token || !studentId) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      formData.append('studentId', studentId);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/student-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 400) {
          throw new Error(errorData?.detail || t('upload.invalidRequest'));
        }
        if (response.status === 401) {
          throw new Error(t('upload.unauthorized'));
        }
        if (response.status === 404) {
          throw new Error(errorData?.detail || t('upload.studentNotFound'));
        }

        throw new Error(errorData?.detail || t('upload.failed'));
      }

      setUploadProgress(100);
      const uploadedDocument = await response.json();

      toast({
        title: t('upload.successTitle'),
        description: t('upload.successDescription'),
      });

      onSuccess(uploadedDocument);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('upload.failed'));

      toast({
        title: t('upload.errorTitle'),
        description: err instanceof Error ? err.message : t('upload.failed'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [file, name, description, studentId, token, t, onSuccess, resetForm, onClose]);

  // Portal state - only render after mount to ensure document.body exists
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Upload size={20} className="text-secondary" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {t('upload.title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Student Info Banner (when uploading for a specific student) */}
          {studentName && (
            <div className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="p-2 bg-secondary/20 rounded-full">
                <User size={18} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs text-secondary/80 font-medium uppercase tracking-wide">
                  {t('upload.uploadingFor')}
                </p>
                <p className="text-white font-semibold">{studentName}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-secondary bg-secondary/10'
                : file
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={e => handleFileSelect(e.target.files)}
              className="hidden"
              accept={SUPPORTED_EXTENSIONS}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-4">
                <Loader2 size={40} className="mx-auto text-secondary animate-spin" />
                <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-gray-400">{t('uploading')}... {uploadProgress}%</p>
              </div>
            ) : file ? (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg w-fit mx-auto">
                  {getFileIcon(file.type)}
                </div>
                <div>
                  <p className="text-white font-medium truncate max-w-xs mx-auto">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <p className="text-xs text-secondary">
                  {t('upload.clickToChange')}
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white/5 rounded-full w-fit mx-auto mb-4">
                  <Plus size={28} className="text-secondary" />
                </div>
                <p className="text-white font-medium mb-2">{t('dragDropText')}</p>
                <p className="text-sm text-gray-400">{t('upload.supportedFormatsDetail')}</p>
              </>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('upload.nameLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('upload.namePlaceholder')}
              maxLength={255}
              disabled={isUploading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/255
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('upload.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('upload.descriptionPlaceholder')}
              maxLength={1000}
              rows={3}
              disabled={isUploading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors resize-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-white/10 bg-gray-800/50 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50 font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !name.trim() || !studentId}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 min-w-[160px] bg-secondary text-primary text-lg font-semibold rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('uploading')}...
              </>
            ) : (
              <>
                <Upload size={20} />
                {t('upload.submit')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
