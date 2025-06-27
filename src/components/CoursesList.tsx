// src/app/[locale]/admin/components/CoursesList.tsx

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

export default function CoursesList() {
  const t = useTranslations('Admin.coursesList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDescription'),
      });

      // Atualizar lista
      fetchCourses();
    } catch (error) {
      toast({
        title: t('error.deleteTitle'),
        description: t('error.deleteDescription'),
        variant: 'destructive',
      });
    }
  };

  // Filtrar cursos baseado na busca
  const filteredCourses = courses.filter(course => {
    const translation =
      course.translations.find(t => t.locale === locale) ||
      course.translations[0];
    return (
      course.slug
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      translation?.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      translation?.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <BookOpen size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Barra de busca */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {courses.length}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.total')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {
              courses.filter(
                c => c.translations.length === 3
              ).length
            }
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.complete')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {
              courses.filter(c => c.translations.length < 3)
                .length
            }
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.incomplete')}
          </p>
        </div>
      </div>

      {/* Lista de cursos */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map(course => {
            const translation =
              course.translations.find(
                t => t.locale === locale
              ) || course.translations[0];

            return (
              <div
                key={course.id}
                className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {/* Imagem do curso */}
                <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={course.imageUrl}
                    alt={translation?.title || ''}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Informações do curso */}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">
                    {translation?.title || 'Sem título'}
                  </h4>
                  <p className="text-sm text-gray-400 line-clamp-1">
                    {translation?.description ||
                      'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Slug: {course.slug}</span>
                    <span>
                      ID: {course.id.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {course.translations.length}/3{' '}
                      {t('languages')}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                    title={t('actions.view')}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                    title={t('actions.edit')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                    title={t('actions.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noCourses')}
          </p>
        </div>
      )}
    </div>
  );
}
