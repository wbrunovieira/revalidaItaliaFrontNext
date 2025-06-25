// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/lessons/[lessonId]/not-found.tsx

import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function LessonNotFound() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <BookOpen
          size={64}
          className="text-gray-500 mx-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-white mb-4">
          Aula não encontrada
        </h1>
        <p className="text-gray-300 mb-8 max-w-md">
          A aula que você está procurando não existe ou foi
          removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
