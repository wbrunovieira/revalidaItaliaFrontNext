// /src/components/ConvertToLiveModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Radio, Loader2, CheckCircle, AlertTriangle, Video, Clock, Calendar, Info, Link as LinkIcon } from 'lucide-react';

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

interface Module {
  id: string;
  courseId: string;
  slug: string;
  order: number;
  translations: Translation[];
}

interface Lesson {
  id: string;
  moduleId: string;
  courseId?: string;
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
  const { token, user } = useAuth();
  const userId = user?.id;

  const [converting, setConverting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recordedAt, setRecordedAt] = useState<string>('');
  const [conversionData, setConversionData] = useState<{
    sessionId: string;
    recordingId: string;
  } | null>(null);

  // Estados para vincular lesson relacionada
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);
  const [selectedRelatedLessonId, setSelectedRelatedLessonId] = useState<string>('');
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const getTranslation = (translations: Translation[]) => {
    return translations.find(tr => tr.locale === locale) || translations[0];
  };

  // Buscar módulos do curso da lesson
  const fetchModules = useCallback(async (courseId: string) => {
    if (!token) return;

    setLoadingModules(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/modules`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoadingModules(false);
    }
  }, [token, apiUrl]);

  // Buscar lessons do módulo selecionado
  const fetchLessons = useCallback(async (courseId: string, moduleId: string) => {
    if (!token) return;

    setLoadingLessons(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRelatedLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoadingLessons(false);
    }
  }, [token, apiUrl]);

  // Buscar módulos quando o modal abre
  useEffect(() => {
    if (open && lesson?.courseId) {
      fetchModules(lesson.courseId);
    }
  }, [open, lesson, fetchModules]);

  // Buscar lessons quando um módulo é selecionado
  useEffect(() => {
    if (selectedModuleId && lesson?.courseId) {
      fetchLessons(lesson.courseId, selectedModuleId);
      setSelectedRelatedLessonId(''); // Limpar lesson selecionada ao trocar módulo
    } else {
      setRelatedLessons([]);
      setSelectedRelatedLessonId('');
    }
  }, [selectedModuleId, lesson, fetchLessons]);

  const handleConvert = async () => {
    if (!lesson || !userId) {
      return;
    }

    // Validar data se foi fornecida
    if (recordedAt) {
      const selectedDate = new Date(recordedAt);
      const now = new Date();

      if (selectedDate > now) {
        toast({
          title: t('errors.futureDate'),
          description: t('errors.futureDateDescription'),
          variant: 'destructive',
        });
        return;
      }
    }

    setConverting(true);

    try {
      // Construir o body com recordedAt e relatedLessonId opcionais
      const body: { hostId: string; recordedAt?: string; relatedLessonId?: string } = {
        hostId: userId,
      };

      // Só incluir recordedAt se foi fornecido, senão usa lesson.createdAt do backend
      if (recordedAt) {
        body.recordedAt = new Date(recordedAt).toISOString();
      }

      // Incluir relatedLessonId se foi selecionado
      if (selectedRelatedLessonId) {
        body.relatedLessonId = selectedRelatedLessonId;
      }

      const response = await fetch(
        `${apiUrl}/api/v1/admin/lessons/${lesson.id}/convert-to-recording`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body),
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
            } else if (error.message?.includes('relatedLessonId')) {
              throw new Error(t('errors.invalidRelatedLesson'));
            } else {
              throw new Error(t('errors.validation'));
            }
          case 403:
            throw new Error(t('errors.forbidden'));
          case 404:
            if (error.message?.includes('Lesson not found')) {
              throw new Error(t('errors.relatedLessonNotFound'));
            }
            throw new Error(t('errors.notFound'));
          case 409:
            throw new Error(t('errors.alreadyConverted'));
          case 500:
            if (error.message?.includes('different course')) {
              throw new Error(t('errors.differentCourse'));
            }
            throw new Error(t('errors.generic'));
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
    setRecordedAt('');
    setConversionData(null);
    setSelectedModuleId('');
    setSelectedRelatedLessonId('');
    setModules([]);
    setRelatedLessons([]);
    onClose();
  };

  if (!lesson) return null;

  const lessonTranslation = getTranslation(lesson.translations);

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

          {/* Campo de Data Customizada (Opcional) */}
          {!success && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-secondary" />
                {t('recordedDate')}
                <span className="text-xs font-normal text-gray-400">({t('optional')})</span>
              </h4>
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  disabled={converting}
                />
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <p>{t('recordedDateHint')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vincular Lesson Relacionada (Opcional) */}
          {!success && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-secondary" />
                {t('relatedLesson.title')}
                <span className="text-xs font-normal text-gray-400">({t('optional')})</span>
              </h4>
              <div className="space-y-3">
                {/* Select de Módulo */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    {t('relatedLesson.selectModule')}
                  </label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    disabled={converting || loadingModules || modules.length === 0}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingModules
                        ? t('relatedLesson.loadingModules')
                        : modules.length === 0
                        ? t('relatedLesson.noModules')
                        : t('relatedLesson.selectModulePlaceholder')}
                    </option>
                    {modules.map((module) => {
                      const moduleTranslation = getTranslation(module.translations);
                      return (
                        <option key={module.id} value={module.id}>
                          {moduleTranslation.title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Select de Lesson */}
                {selectedModuleId && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      {t('relatedLesson.selectLesson')}
                    </label>
                    <select
                      value={selectedRelatedLessonId}
                      onChange={(e) => setSelectedRelatedLessonId(e.target.value)}
                      disabled={converting || loadingLessons || relatedLessons.length === 0}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingLessons
                          ? t('relatedLesson.loadingLessons')
                          : relatedLessons.length === 0
                          ? t('relatedLesson.noLessons')
                          : t('relatedLesson.selectLessonPlaceholder')}
                      </option>
                      {relatedLessons.map((relatedLesson) => {
                        const lessonTranslation = getTranslation(relatedLesson.translations);
                        return (
                          <option key={relatedLesson.id} value={relatedLesson.id}>
                            {lessonTranslation.title}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <p>{t('relatedLesson.hint')}</p>
                </div>
              </div>
            </div>
          )}

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
