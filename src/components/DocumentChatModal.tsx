// /src/components/DocumentChatModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X,
  Loader2,
  Send,
  MessageCircle,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

interface DocumentInfo {
  id: string;
  name: string;
  studentName?: string;
  originalFileName?: string;
}

interface DocumentChatModalProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DocumentChatModal({
  isOpen,
  document,
  onClose,
  onSuccess,
}: DocumentChatModalProps) {
  const t = useTranslations('documentChat');
  const { token } = useAuth();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!document || !token || !message.trim()) return;

    // Validate message length
    if (message.trim().length < 10) {
      toast({ title: t('validation.messageTooShort'), variant: 'destructive' });
      return;
    }

    if (message.length > 5000) {
      toast({ title: t('validation.messageTooLong'), variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const response = await fetch(`${apiUrl}/api/v1/support/documents/${document.id}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('error.documentNotFound'));
        }
        if (response.status === 403) {
          throw new Error(t('error.notAuthorized'));
        }
        throw new Error(t('error.sendFailed'));
      }

      const data = await response.json();

      setIsSuccess(true);
      toast({
        title: data.isExistingTicket ? t('success.messageAdded') : t('success.chatStarted'),
      });

      // Wait a moment to show success state, then close
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : t('error.sendFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  }, [document, token, message, t, onSuccess, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSending) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSending, onClose]);

  // Handle Ctrl+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSending && message.trim().length >= 10) {
      handleSend();
    }
  };

  if (!isOpen || !document) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-white/10 w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-secondary" />
            <h2 className="text-lg font-bold text-white">{t('title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSending}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success State */}
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <p className="text-white font-medium text-center">{t('success.title')}</p>
              <p className="text-gray-400 text-sm text-center mt-1">{t('success.description')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Document Info */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-secondary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400">{t('documentInfo')}</p>
                    <p className="text-white font-medium truncate">{document.name}</p>
                    {document.originalFileName && (
                      <p className="text-xs text-gray-500 truncate">{document.originalFileName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Info */}
              {document.studentName && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-secondary" />
                    <div>
                      <p className="text-sm text-gray-400">{t('studentInfo')}</p>
                      <p className="text-white font-medium">{document.studentName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-300">{t('info')}</p>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('messageLabel')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('messagePlaceholder')}
                  rows={5}
                  maxLength={5000}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all resize-none"
                  disabled={isSending}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {t('minChars', { min: 10 })}
                  </p>
                  <p className={`text-xs ${message.length > 4500 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {message.length}/5000
                  </p>
                </div>
              </div>

              {/* Keyboard Shortcut Hint */}
              <p className="text-xs text-gray-500 text-center">
                {t('shortcutHint')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 flex-shrink-0 bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSending}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || message.trim().length < 10}
              className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('send')}
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
