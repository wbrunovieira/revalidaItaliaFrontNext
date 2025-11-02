// /src/components/ConvertToLiveModal.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio, Loader2, CheckCircle, AlertTriangle, Video, Clock } from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoData {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  imageUrl?: string;
  videoId?: string;
  flashcardIds: string[];
  quizIds: string[];
  commentIds: string[];
  translations: Translation[];
  video?: VideoData;
  createdAt: string;
  updatedAt: string;
}

interface ConvertToLiveModalProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  onSuccess: () => void;
}

export default function ConvertToLiveModal({
  open,
  onClose,
  lesson,
  onSuccess,
}: ConvertToLiveModalProps) {
  const t = useTranslations('Admin.lessonsList.convertModal');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { token, userId } = useAuth();

  const [converting, setConverting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [conversionData, setConversionData] = useState<{
    sessionId: string;
    recordingId: string;
  } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const getTranslation = (translations: Translation[]) => {
    return translations.find(tr => tr.locale === locale) || translations[0];
  };

  const handleConvert = async () => {
    if (!lesson || !userId) return;

    setConverting(true);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/admin/lessons/${lesson.id}/convert-to-recording`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            hostId: userId,
            recordedAt: lesson.createdAt,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        // Tratamento de erros específicos
        switch (response.status) {
          case 400:
            if (error.title === 'Lesson Has No Video') {
              throw new Error(t('errors.noVideo'));
            } else if (error.title === 'Video Not From PandaVideo') {
              throw new Error(t('errors.notPandaVideo'));
            } else {
              throw new Error(t('errors.validation'));
            }
          case 403:
            throw new Error(t('errors.forbidden'));
          case 404:
            throw new Error(t('errors.notFound'));
          case 409:
            throw new Error(t('errors.alreadyConverted'));
          default:
            throw new Error(t('errors.generic'));
        }
      }

      const data = await response.json();

      setConversionData({
        sessionId: data.sessionId,
        recordingId: data.recordingId,
      });
      setSuccess(true);

      toast({
        title: t('successTitle'),
        description: t('successDescription'),
      });

      // Aguarda 2 segundos antes de fechar para mostrar o feedback
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao converter lesson:', error);
      toast({
        title: t('errorTitle'),
        description: error instanceof Error ? error.message : t('errors.generic'),
        variant: 'destructive',
      });
      setConverting(false);
    }
  };

  const handleClose = () => {
    setConverting(false);
    setSuccess(false);
    setConversionData(null);
    onClose();
  };

  if (!lesson) return null;

  const lessonTranslation = getTranslation(lesson.translations);
  const videoTranslation = lesson.video ? getTranslation(lesson.video.translations) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Radio className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                {t('title')}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {t('description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da Lesson */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Video className="h-4 w-4 text-secondary" />
              {t('lessonInfo')}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-400">{t('lessonTitle')}:</span>
                <p className="text-sm text-white font-medium">{lessonTranslation.title}</p>
              </div>
              {lesson.video && (
                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {Math.floor(lesson.video.durationInSeconds / 60)}min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">
                      {lesson.video.providerVideoId.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* O que acontecerá */}
          {!success && (
            <div className="bg-blue-500/10 border-blue-500/30 border rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <strong className="block mb-2">{t('whatHappens.title')}</strong>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t('whatHappens.createSession')}</li>
                  <li>{t('whatHappens.createRecording')}</li>
                  <li>{t('whatHappens.available')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Feedback de sucesso */}
          {success && conversionData && (
            <div className="bg-green-500/10 border-green-500/30 border rounded-lg p-4 flex gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-300">
                <strong className="block mb-2">{t('success.title')}</strong>
                <div className="space-y-1 text-xs">
                  <p>{t('success.sessionCreated')}: <code className="bg-white/10 px-1 rounded">{conversionData.sessionId.slice(0, 8)}...</code></p>
                  <p>{t('success.recordingCreated')}: <code className="bg-white/10 px-1 rounded">{conversionData.recordingId.slice(0, 8)}...</code></p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!success ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={converting}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleConvert}
                disabled={converting}
                className="bg-secondary hover:bg-secondary/90 text-white"
              >
                {converting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('converting')}
                  </>
                ) : (
                  <>
                    <Radio className="mr-2 h-4 w-4" />
                    {t('confirm')}
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t('successMessage')}</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
