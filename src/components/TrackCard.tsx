// src/components/TrackCard.tsx
"use client";

import { Route, BookOpen, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courses?: any[];
  translations?: Translation[];
}

interface TrackCardProps {
  track: Track;
  locale: string;
  index: number;
}

export default function TrackCard({ track, locale, index }: TrackCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const t = useTranslations('Tracks');

  const list = track.translations ?? [];
  const translation = list.find(tr => tr.locale === locale) ?? 
                     list[0] ?? { title: '', description: '' };

  // Dados da trilha
  const coursesCount = track.courses?.length || 0;
  const estimatedHours = coursesCount * 8; // Estimativa de horas
  const isPopular = coursesCount > 5;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !imageRef.current) return;

    const card = cardRef.current;
    const image = imageRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    // Parallax na imagem
    const moveX = (x - centerX) / 30;
    const moveY = (y - centerY) / 30;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    image.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !imageRef.current) return;
    
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    imageRef.current.style.transform = 'scale(1) translate(0px, 0px)';
  };

  return (
    <Link
      href={`/${locale}/tracks/${track.slug}`}
      className="group block"
    >
      <div 
        ref={cardRef}
        className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 track-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(121, 190, 217, 0.08) 1.5px, transparent 1.5px),
            radial-gradient(circle at 80% 80%, rgba(56, 135, 166, 0.08) 1.5px, transparent 1.5px),
            radial-gradient(circle at 50% 50%, rgba(121, 190, 217, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '25px 25px, 20px 20px, 35px 35px',
          backgroundPosition: '0 0, 12px 12px, 5px 5px'
        }}
      >
        {/* Barra superior decorativa */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/30 via-secondary/30 to-accent/30 group-hover:from-accent via-secondary group-hover:to-accent transition-all duration-500">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide-progress"></div>
        </div>
        
        {/* Badge Popular */}
        {isPopular && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-secondary text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={14} />
              <span className="font-semibold">{t('popular')}</span>
            </div>
          </div>
        )}
        
        {/* Container da imagem com parallax */}
        <div className="relative overflow-hidden aspect-video">
          <img
            ref={imageRef}
            src={track.imageUrl}
            alt={translation.title}
            className="w-full h-full object-cover transition-all duration-700 will-change-transform"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Grid pattern overlay discreto */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          ></div>

          {/* Ícone de trilha no canto */}
          <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
            <Route size={20} className="text-accent" />
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-6 space-y-4 relative">
          {/* Background pattern discreto no conteúdo */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(circle at 2px 2px, rgba(121, 190, 217, 0.05) 1px, transparent 0)
              `,
              backgroundSize: '24px 24px'
            }}
          ></div>

          {/* Título com melhorias */}
          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-accent transition-all duration-300 line-clamp-2 leading-tight tracking-tight">
              {translation.title}
            </h3>
            
            {/* Linha divisória moderna */}
            <div className="relative">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200"></div>
              {/* Dot central na linha */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 delay-300"></div>
            </div>
          </div>

          {/* Descrição melhorada */}
          {translation.description && (
            <div className="overflow-hidden relative z-10">
              <p className="text-gray-600 leading-relaxed text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 line-clamp-3 font-medium">
                {translation.description}
              </p>
            </div>
          )}

          {/* Estatísticas da trilha */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-secondary transition-colors duration-300">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                  <BookOpen size={14} className="text-secondary" />
                </div>
                <span className="font-medium">{coursesCount} {t('courses')}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-accent transition-colors duration-300">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <Clock size={14} className="text-accent" />
                </div>
                <span className="font-medium">{estimatedHours}h</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full group-hover:bg-accent/10 group-hover:text-accent transition-all duration-300 font-semibold">
              {t('startTrack')}
            </div>
          </div>
        </div>

        {/* Hover border effect */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Dots pattern overlay mais visível no hover */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-3 transition-opacity duration-700"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 15%, rgba(121, 190, 217, 0.012) 0.3px, transparent 0.3px),
              radial-gradient(circle at 85% 15%, rgba(56, 135, 166, 0.012) 0.3px, transparent 0.3px),
              radial-gradient(circle at 15% 85%, rgba(56, 135, 166, 0.008) 0.25px, transparent 0.25px),
              radial-gradient(circle at 85% 85%, rgba(121, 190, 217, 0.008) 0.25px, transparent 0.25px)
            `,
            backgroundSize: '40px 40px, 40px 40px, 38px 38px, 38px 38px',
            backgroundPosition: '0 0, 20px 0, 0 20px, 20px 20px'
          }}
        ></div>
        
        {/* Glow effect discreto */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
}