// /src/components/ArgumentViewModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  List,
  Calendar,
  Clock,
  Copy,
  Check,
  BookOpen,
  Hash,
} from 'lucide-react';

interface ArgumentDetails {
  id: string;
  title: string;
  assessmentId?: string;
  assessment?: {
    id: string;
    title: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ArgumentViewModalProps {
  argumentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Utility function for formatting dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ArgumentViewModal({
  argumentId,
  isOpen,
  onClose,
}: ArgumentViewModalProps) {
  const t = useTranslations('Admin.argumentView');
  const { toast } = useToast();

  const [argument, setArgument] = useState<ArgumentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch argument details
  const fetchArgumentDetails = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments/${id}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          
          switch (error.error) {
            case 'ARGUMENT_NOT_FOUND':
              throw new Error(t('error.notFound'));
            case 'INVALID_INPUT':
              throw new Error(t('error.invalidId'));
            default:
              throw new Error(t('error.fetchDescription'));
          }
        }

        const data = await response.json();
        if (data.success && data.argument) {
          setArgument(data.argument);
        }
      } catch (error) {
        console.error('Error fetching argument details:', error);
        toast({
          title: t('error.fetchTitle'),
          description: error instanceof Error ? error.message : t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [t, toast]
  );

  // Copy to clipboard function
  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: t('copySuccess'),
          description: t('copyDescription', { field }),
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast({
          title: t('copyError'),
          description: t('copyErrorDescription'),
          variant: 'destructive',
        });
      }
    },
    [t, toast]
  );

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && argumentId) {
      fetchArgumentDetails(argumentId);
    } else {
      setArgument(null);
    }
  }, [isOpen, argumentId, fetchArgumentDetails]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <List size={28} className="text-green-400" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            // Loading skeleton
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-700 rounded w-2/3"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : argument ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {argument.title}
                </h3>
              </div>

              {/* Details Grid */}
              <div className="grid gap-4">
                {/* ID Field */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                        <Hash size={20} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('fields.id')}</p>
                        <p className="text-white font-mono text-sm">
                          {argument.id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(argument.id, t('fields.id'))}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title={t('copyToClipboard')}
                    >
                      {copiedField === t('fields.id') ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Assessment Field */}
                {argument.assessment && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center">
                          <BookOpen size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.assessment')}</p>
                          <p className="text-white">{argument.assessment.title}</p>
                          <p className="text-sm text-gray-500">
                            {t(`types.${argument.assessment.type.toLowerCase()}`)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(argument.assessmentId || '', t('fields.assessmentId'))}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('copyToClipboard')}
                      >
                        {copiedField === t('fields.assessmentId') ? (
                          <Check size={16} className="text-green-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Created At */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center">
                        <Calendar size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('fields.createdAt')}</p>
                        <p className="text-white">{formatDate(argument.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatDate(argument.createdAt), t('fields.createdAt'))}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title={t('copyToClipboard')}
                    >
                      {copiedField === t('fields.createdAt') ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Updated At */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-400/20 rounded-lg flex items-center justify-center">
                        <Clock size={20} className="text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('fields.updatedAt')}</p>
                        <p className="text-white">{formatDate(argument.updatedAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatDate(argument.updatedAt), t('fields.updatedAt'))}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title={t('copyToClipboard')}
                    >
                      {copiedField === t('fields.updatedAt') ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              {t('noData')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}