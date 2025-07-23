'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
}

interface ContinueLearningData {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonImageUrl: string;
  videoProgress: VideoProgress;
  lessonUrl: string;
  lastUpdatedAt: string;
}

interface ContinueLearningResponse {
  hasProgress: boolean;
  lastAccessed?: ContinueLearningData;
}

export default function ContinueLearning() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContinueLearningResponse | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchContinueLearning();
  }, []);

  const fetchContinueLearning = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const token = document.cookie.split('token=')[1]?.split(';')[0] || '';
      
      const response = await fetch(`${apiUrl}/api/v1/users/me/continue-learning`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch continue learning');
      }

      const result = await response.json();
      console.log('[ContinueLearning] API Response:', result);
      setData(result);
    } catch (error) {
      console.error('Error fetching continue learning:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatLastUpdated = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return t('continueWatching.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('continueWatching.hoursAgo', { hours });
    }
    return t('continueWatching.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
  };

  const handleContinue = () => {
    if (data?.lastAccessed?.lessonUrl) {
      router.push(data.lastAccessed.lessonUrl);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-primary-dark via-primary to-primary-dark rounded-2xl p-8 mb-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  if (!data?.hasProgress || !data.lastAccessed) {
    return null;
  }

  const { lastAccessed } = data;
  const remainingTime = lastAccessed.videoProgress.duration - lastAccessed.videoProgress.currentTime;
  
  // Fix image URL if it has example.com prefix
  const fixedImageUrl = lastAccessed.lessonImageUrl?.replace('https://example.com', '') || '';

  return (
    <div className="w-full bg-gradient-to-br from-primary-dark via-primary to-primary-dark rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Thumbnail */}
        <div className="relative w-full md:w-48 h-32 md:h-36 rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
          {!imageError && 
           fixedImageUrl && 
           (fixedImageUrl.startsWith('http') || fixedImageUrl.startsWith('/')) ? (
            <Image
              src={fixedImageUrl}
              alt={lastAccessed.lessonTitle}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="text-white/50" size={48} />
            </div>
          )}
          
          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div 
              className="h-full bg-gradient-to-r from-secondary to-accent shadow-glow"
              style={{ width: `${lastAccessed.videoProgress.percentage}%` }}
            />
          </div>
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Play className="text-primary ml-1" size={24} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 text-secondary mb-2 justify-center md:justify-start">
            <Sparkles size={16} />
            <span className="text-sm font-medium">{t('continueWatching.title')}</span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">
            {lastAccessed.lessonTitle}
          </h3>
          
          <p className="text-white/70 text-sm mb-4">
            <span className="font-medium">{lastAccessed.courseTitle}</span>
            <span className="mx-2">•</span>
            <span>{lastAccessed.moduleTitle}</span>
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{t('continueWatching.timeRemaining', { time: formatTime(remainingTime) })}</span>
            </div>
            <span className="hidden md:block">•</span>
            <span>{Math.round(lastAccessed.videoProgress.percentage)}% {t('continueWatching.completed')}</span>
            <span className="hidden md:block">•</span>
            <span className="text-xs">{formatLastUpdated(lastAccessed.lastUpdatedAt)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleContinue}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-secondary to-accent text-primary font-semibold rounded-xl 
                     hover:shadow-lg transform hover:scale-105 transition-all duration-300 
                     flex items-center justify-center gap-2 group/btn"
        >
          <span>{t('continueWatching.continueButton')}</span>
          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}