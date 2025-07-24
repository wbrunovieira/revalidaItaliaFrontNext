// src/components/ModuleCard.tsx
"use client";

import { Layers, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  slug: string;
  imageUrl?: string | null;
  order: number;
  videoId?: string;
  translations?: Translation[];
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  lessons?: Lesson[];
  translations?: Translation[];
}

interface ModuleCardProps {
  module: Module;
  courseSlug: string;
  locale: string;
  index: number;
  totalModules: number;
  isCompleted?: boolean;
}

export default function ModuleCard({ 
  module, 
  courseSlug, 
  locale, 
  index, 
  totalModules,
  isCompleted = false 
}: ModuleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const t = useTranslations('Course');

  const list = module.translations ?? [];
  const translation = list.find(tr => tr.locale === locale) ?? 
                     list[0] ?? { title: '', description: '' };

  // Dados do módulo
  const lessonsCount = module.lessons?.length || Math.floor(Math.random() * 5) + 3; // Mock para demonstração
  const estimatedMinutes = lessonsCount * 15; // Estimativa de 15 minutos por aula
  const moduleNumber = index + 1;

  // Mock progress data - remover quando vier da API
  const mockProgress = isCompleted ? 100 : [15, 35, 50, 75, 90, 10][index % 6];
  const isStarted = mockProgress > 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !imageRef.current) return;

    const card = cardRef.current;
    const image = imageRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    
    // Parallax na imagem
    const moveX = (x - centerX) / 35;
    const moveY = (y - centerY) / 35;
    
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
      {/* Badge de número do módulo */}
      <div className="absolute -top-3 -left-3 z-20 transition-all duration-300 group-hover:scale-110">
        <div
          className={`
            relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
            ${
              isCompleted
                ? 'bg-green-500 text-white'
                : 'bg-secondary text-primary shadow-lg'
            }
          `}
        >
          {isCompleted ? (
            <CheckCircle size={20} />
          ) : (
            moduleNumber
          )}
        </div>
        {/* Anel pulsante no hover */}
        {!isCompleted && (
          <div className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-0 group-hover:opacity-75" />
        )}
      </div>

      <Link
        href={`/${locale}/courses/${courseSlug}/modules/${module.slug}`}
        className="block"
      >
        <div 
          ref={cardRef}
          className="relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 module-card border-l-[10px] hover:border-l-[12px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            borderLeftColor: 'var(--neutral)',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(12, 53, 89, 0.06) 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, rgba(217, 197, 193, 0.06) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, rgba(12, 53, 89, 0.03) 0.8px, transparent 0.8px)
            `,
            backgroundSize: '20px 20px, 18px 18px, 30px 30px',
            backgroundPosition: '0 0, 10px 10px, 5px 5px'
          }}
        >
          {/* Linha de progresso */}
          {isStarted ? (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out group-hover:animate-pulse"
                style={{ width: `${mockProgress}%` }}
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide-progress"></div>
              </div>
            </div>
          ) : (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20"></div>
          )}
          
          {/* Container da imagem com parallax */}
          <div className="relative overflow-hidden h-32">
            <Image
              ref={imageRef}
              src={module.imageUrl || '/placeholder-module.jpg'}
              alt={translation.title}
              fill
              className="object-cover transition-all duration-700 will-change-transform"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Ícone de módulo no canto */}
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300">
              <Layers size={16} className="text-primary" />
            </div>
          </div>

          {/* Conteúdo do card */}
          <div className="p-4 space-y-3 relative">
            {/* Título */}
            <div className="space-y-2 relative z-10">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-all duration-300 line-clamp-1 leading-tight tracking-tight">
                {translation.title}
              </h3>
              
              {/* Linha divisória moderna */}
              <div className="relative h-px">
                <div className="h-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
              </div>
            </div>

            {/* Descrição */}
            {translation.description && (
              <div className="overflow-hidden relative z-10">
                <p className="text-gray-600 text-xs transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75 line-clamp-2 font-medium">
                  {translation.description}
                </p>
              </div>
            )}

            {/* Estatísticas e progresso */}
            <div className="space-y-2 relative z-10">
              {/* Estatísticas sempre visíveis */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-600 group-hover:text-primary transition-colors duration-300">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <PlayCircle size={12} className="text-primary" />
                    </div>
                    <span className="font-medium">{lessonsCount} {t('lessons')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600 group-hover:text-secondary transition-colors duration-300">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                      <Clock size={12} className="text-secondary" />
                    </div>
                    <span className="font-medium">{estimatedMinutes}min</span>
                  </div>
                </div>
              </div>

              {/* Progresso e botão */}
              <div className="flex items-center justify-between gap-2">
                {isStarted ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 group-hover:animate-pulse"
                        style={{ width: `${mockProgress}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <span className="text-primary font-medium text-xs group-hover:scale-110 transition-transform duration-300">
                      {mockProgress}%
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
                
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 font-semibold whitespace-nowrap">
                  {t('startModule')}
                </div>
              </div>
            </div>
          </div>

          {/* Hover border effect */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Glow effect discreto */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </Link>

      {/* Informações do módulo */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
          {t('moduleOrder', {
            order: moduleNumber,
            total: totalModules,
          })}
        </p>
      </div>

      {/* Linha conectora entre módulos (apenas se não for o último) */}
      {index < totalModules - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-600/30" />
      )}
    </div>
  );
}