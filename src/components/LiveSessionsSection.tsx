'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Radio, Calendar, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, es, it } from 'date-fns/locale';

interface LiveSessionRecording {
  sessionTitle: string;
  sessionDate: string;
  recordingLesson: {
    id: string;
    slug: string;
    title: string;
    hasVideo: boolean;
  };
}

interface LiveSessionsSectionProps {
  liveSessionRecordings: LiveSessionRecording[];
  locale: string;
  courseSlug: string;
  moduleSlug: string;
}

export default function LiveSessionsSection({
  liveSessionRecordings,
  locale,
  courseSlug,
  moduleSlug,
}: LiveSessionsSectionProps) {
  const t = useTranslations('LessonPage.liveSessions');

  if (!liveSessionRecordings || liveSessionRecordings.length === 0) {
    return null;
  }

  const getDateLocale = () => {
    switch (locale) {
      case 'pt':
      case 'pt_BR':
        return ptBR;
      case 'es':
      case 'es_ES':
        return es;
      case 'it':
      case 'it_IT':
        return it;
      default:
        return ptBR;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: getDateLocale() });
    } catch {
      return dateString;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="h-6 w-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">
          {t('title')}
        </h2>
      </div>

      <div className="space-y-3">
        {liveSessionRecordings.map((recording, index) => (
          <div
            key={index}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-red-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Session Title */}
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" />
                  {recording.sessionTitle}
                </h3>

                {/* Session Date */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {formatDate(recording.sessionDate)}
                </div>

                {/* Recording Link */}
                <Link
                  href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${recording.recordingLesson.slug}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {recording.recordingLesson.hasVideo ? (
                    <>
                      <Video className="h-4 w-4" />
                      {t('watchRecording')}
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      {t('recordingProcessing')}
                    </>
                  )}
                </Link>
              </div>

              {/* Status Badge */}
              {recording.recordingLesson.hasVideo ? (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                  {t('available')}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                  {t('processing')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {liveSessionRecordings.length > 0 && (
        <p className="text-sm text-gray-400 mt-4">
          {t('description')}
        </p>
      )}
    </section>
  );
}
