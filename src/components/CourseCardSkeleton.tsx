// src/components/CourseCardSkeleton.tsx
"use client";

interface CourseCardSkeletonProps {
  count?: number;
}

export default function CourseCardSkeleton({ count = 6 }: CourseCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="group block">
          <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
            {/* Linha de progresso skeleton */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
              <div className="h-full bg-gray-300 w-1/3 animate-pulse"></div>
            </div>
            
            {/* Container da imagem skeleton */}
            <div className="relative overflow-hidden aspect-video bg-gray-300">
              <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse"></div>
            </div>

            {/* Conteúdo do card skeleton */}
            <div className="p-6 space-y-4">
              {/* Título skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-gray-300 rounded-md w-4/5 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded-md w-3/5 animate-pulse"></div>
              </div>

              {/* Descrição skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>

              {/* Progresso e ícone skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}