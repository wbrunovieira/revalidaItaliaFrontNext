// /src/components/EditDocumentModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X,
  Loader2,
  AlertCircle,
  Save,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

interface DocumentDetails {
  id: string;
  name: string;
  description?: string | null;
  reviewNotes?: string | null;
}

interface EditDocumentModalProps {
  isOpen: boolean;
  documentId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  isAdminView?: boolean;
}

export default function EditDocumentModal({
  isOpen,
  documentId,
  onClose,
  onSuccess,
  isAdminView = false,
}: EditDocumentModalProps) {
  const t = useTranslations('editDocument');
  const { token } = useAuth();

  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch document details
  const fetchDocument = useCallback(async () => {
    if (!documentId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('error.notFound'));
        }
        if (response.status === 401) {
          throw new Error(t('error.unauthorized'));
        }
        throw new Error(t('error.fetchFailed'));
      }

      const data = await response.json();
      setDocument(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setReviewNotes(data.reviewNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId, token, t]);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument();
    } else {
      setDocument(null);
      setError(null);
      setName('');
      setDescription('');
      setReviewNotes('');
    }
  }, [isOpen, documentId, fetchDocument]);

  // Handle save
  const handleSave = async () => {
    if (!documentId || !token) return;

    // Validation
    if (!name.trim()) {
      toast({ title: t('validation.nameRequired'), variant: 'destructive' });
      return;
    }
    if (name.length > 255) {
      toast({ title: t('validation.nameTooLong'), variant: 'destructive' });
      return;
    }
    if (description && description.length > 1000) {
      toast({ title: t('validation.descriptionTooLong'), variant: 'destructive' });
      return;
    }
    if (reviewNotes && reviewNotes.length > 2000) {
      toast({ title: t('validation.reviewNotesTooLong'), variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const body: Record<string, string | null> = {
        name: name.trim(),
        description: description.trim() || null,
      };

      // Only include reviewNotes for admin view
      if (isAdminView) {
        body.reviewNotes = reviewNotes.trim() || null;
      }

      const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('error.notFound'));
        }
        if (response.status === 403) {
          throw new Error(t('error.forbidden'));
        }
        if (response.status === 400) {
          throw new Error(t('error.validationFailed'));
        }
        throw new Error(t('error.saveFailed'));
      }

      toast({ title: t('success') });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('error.saveFailed'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-white/10 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-secondary" />
            <h2 className="text-lg font-bold text-white">{t('title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-secondary animate-spin mb-4" />
              <p className="text-gray-400">{t('loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchDocument}
                className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          )}

          {/* Form */}
          {document && !isLoading && !error && (
            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.name')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('placeholders.name')}
                  maxLength={255}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {name.length}/255
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('fields.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('placeholders.description')}
                  maxLength={1000}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all resize-none"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000
                </p>
              </div>

              {/* Review Notes Field - Only for Admin/Analyst */}
              {isAdminView && (
                <div>
                  <label className="block text-sm font-medium text-blue-400 mb-2">
                    {t('fields.reviewNotes')}
                    <span className="ml-2 text-xs text-gray-500">({t('adminOnly')})</span>
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('placeholders.reviewNotes')}
                    maxLength={2000}
                    rows={4}
                    className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-blue-400/70 mt-1">
                    {reviewNotes.length}/2000
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {document && !isLoading && !error && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 flex-shrink-0 bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSaving}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t('save')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, window.document.body);
}
