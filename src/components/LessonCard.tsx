// src/components/LessonCard.tsx
"use client";

import { PlayCircle, Clock, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  slug: string;
  title: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
}

interface Lesson {
  id: string;
  slug: string;
  imageUrl?: string | null;
  order: number;
  videoId?: string;
  translations?: Translation[];
  video?: Video;
}

interface LessonCardProps {
  lesson: Lesson;
  courseSlug: string;
  moduleSlug: string;
  locale: string;
  index: number;
  totalLessons: number;
  isCompleted?: boolean;
}

export default function LessonCard({ 
  lesson, 
  courseSlug,
  moduleSlug, 
  locale, 
  index, 
  totalLessons,
  isCompleted = false 
}: LessonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const t = useTranslations('Module');

  const list = lesson.translations ?? [];
  const translation = list.find(tr => tr.locale === locale) ??
                     list[0] ?? { title: '', description: '' };

  // Dados da aula - usar dados reais do vídeo quando disponível
  const durationInSeconds = lesson.video?.durationInSeconds ?? 0;
  const estimatedMinutes = durationInSeconds > 0
    ? Math.ceil(durationInSeconds / 60)
    : 0;
  const hasVideo = !!lesson.video || !!lesson.videoId;
  const lessonNumber = index + 1;

  // Verificar se aula foi completada:
  // 1. Props isCompleted (vem de ModuleLessonsGrid via API de progresso)
  // 2. video.isSeen (vem do backend quando includeVideo=true)
  const isLessonCompleted = isCompleted || lesson.video?.isSeen || false;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !imageRef.current) return;

    const card = cardRef.current;
    const image = imageRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 30;
    const rotateY = (centerX - x) / 30;
    
    // Parallax na imagem
    const moveX = (x - centerX) / 40;
    const moveY = (y - centerY) / 40;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    image.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !imageRef.current) return;
    
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    imageRef.current.style.transform = 'scale(1) translate(0px, 0px)';
  };

  return (
    <div className="group relative">
      {/* Badge de número da aula */}
      <div className="absolute -top-2 -left-2 z-20 transition-all duration-300 group-hover:scale-110">
        <div className="relative w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md">
          {lessonNumber}
        </div>
        {/* Anel pulsante no hover */}
        {!isLessonCompleted && (
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-0 group-hover:opacity-75" />
        )}
      </div>
      
      {/* Badge de conclusão */}
      {isLessonCompleted && (
        <div className="absolute -top-2 -right-2 z-20 transition-all duration-300 group-hover:scale-110">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
            <CheckCircle size={16} className="text-white" />
          </div>
        </div>
      )}

      <Link
        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lesson.slug || lesson.id}`}
        className="block"
      >
        <div 
          ref={cardRef}
          className={`relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-0.5 lesson-card border-l-[8px] hover:border-l-[10px] ${isLessonCompleted ? 'opacity-70' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            borderLeftColor: 'var(--accent-light)',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(217, 178, 169, 0.05) 0.8px, transparent 0.8px),
              radial-gradient(circle at 80% 80%, rgba(121, 190, 217, 0.05) 0.8px, transparent 0.8px),
              radial-gradient(circle at 50% 50%, rgba(217, 178, 169, 0.03) 0.6px, transparent 0.6px)
            `,
            backgroundSize: '18px 18px, 16px 16px, 25px 25px',
            backgroundPosition: '0 0, 8px 8px, 4px 4px'
          }}
        >
          {/* Linha decorativa no topo */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent-light/15 via-accent/15 to-accent-light/15"></div>
          
          {/* Container da imagem com parallax */}
          <div className="relative overflow-hidden h-24">
            {lesson.imageUrl ? (
              <Image
                ref={imageRef}
                src={lesson.imageUrl}
                alt={translation.title}
                fill
                className="object-cover transition-all duration-700 will-change-transform"
              />
            ) : (
              <div 
                ref={imageRef}
                className="w-full h-full bg-gradient-to-br from-accent-light to-accent transition-all duration-700 will-change-transform flex items-center justify-center"
              >
                <div className="text-white/20">
                  {hasVideo ? (
                    <PlayCircle size={48} />
                  ) : (
                    <FileText size={48} />
                  )}
                </div>
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Ícone de tipo de conteúdo */}
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transform group-hover:scale-110 transition-transform duration-300">
              {hasVideo ? (
                <PlayCircle size={14} className="text-accent" />
              ) : (
                <FileText size={14} className="text-accent-warm" />
              )}
            </div>
          </div>

          {/* Conteúdo do card */}
          <div className="p-3 space-y-2 relative">
            {/* Título */}
            <div className="space-y-1.5 relative z-10">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-accent-light transition-all duration-300 line-clamp-1 leading-tight tracking-tight">
                {translation.title}
              </h3>
              
              {/* Linha divisória moderna */}
              <div className="relative h-px">
                <div className="h-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Estatísticas e progresso */}
            <div className="space-y-2 relative z-10">
              {/* Estatísticas sempre visíveis */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {estimatedMinutes > 0 && (
                    <div className="flex items-center gap-1 text-gray-600 group-hover:text-accent transition-colors duration-300">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                        <Clock size={10} className="text-accent" />
                      </div>
                      <span className="font-medium">{estimatedMinutes}min</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-accent-light/10 group-hover:text-accent-light transition-all duration-300 font-semibold whitespace-nowrap">
                  {isLessonCompleted ? t('reviewLesson') : t('startLesson')}
                </div>
              </div>

            </div>
          </div>

          {/* Hover border effect */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-accent-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Glow effect discreto */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent-light/5 via-transparent to-accent-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </Link>

      {/* Informações da aula */}
      <div className="mt-1.5 text-center">
        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
          {t('lessonOrder', {
            order: lessonNumber,
            total: totalLessons,
          })}
        </p>
      </div>
    </div>
  );
}