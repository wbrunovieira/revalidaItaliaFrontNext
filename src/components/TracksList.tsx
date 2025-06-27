// src/app/[locale]/admin/components/TracksList.tsx

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Route,
  Edit,
  Trash2,
  Eye,
  Search,
  BookOpen,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courseIds: string[];
  translations: Translation[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

export default function TracksList() {
  const t = useTranslations('Admin.tracksList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tracksResponse, coursesResponse] =
        await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tracks`
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/courses`
          ),
        ]);

      if (!tracksResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const tracksData = await tracksResponse.json();
      const coursesData = await coursesResponse.json();

      // Se tracks vier como array direto ou dentro de um objeto
      setTracks(
        Array.isArray(tracksData)
          ? tracksData
          : [tracksData]
      );
      setCourses(coursesData);
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

  const handleDelete = async (trackId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracks/${trackId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete track');
      }

      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDescription'),
      });

      // Atualizar lista
      fetchData();
    } catch (error) {
      toast({
        title: t('error.deleteTitle'),
        description: t('error.deleteDescription'),
        variant: 'destructive',
      });
    }
  };

  // Função para obter os nomes dos cursos de uma trilha
  const getCoursesNames = (courseIds: string[]) => {
    return courseIds.map(id => {
      const course = courses.find(c => c.id === id);
      if (course) {
        const translation =
          course.translations.find(
            t => t.locale === locale
          ) || course.translations[0];
        return translation?.title || 'Sem título';
      }
      return 'Curso não encontrado';
    });
  };

  // Filtrar trilhas baseado na busca
  const filteredTracks = tracks.filter(track => {
    const translation =
      track.translations.find(t => t.locale === locale) ||
      track.translations[0];
    return (
      track.slug
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
          <Route size={24} className="text-secondary" />
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
            {tracks.length}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.total')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {tracks.reduce(
              (sum, track) => sum + track.courseIds.length,
              0
            )}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalCourses')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {
              tracks.filter(
                t => t.translations.length === 3
              ).length
            }
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.complete')}
          </p>
        </div>
      </div>

      {/* Lista de trilhas */}
      {filteredTracks.length > 0 ? (
        <div className="space-y-4">
          {filteredTracks.map(track => {
            const translation =
              track.translations.find(
                t => t.locale === locale
              ) || track.translations[0];
            const coursesNames = getCoursesNames(
              track.courseIds
            );

            return (
              <div
                key={track.id}
                className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {/* Imagem da trilha */}
                <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={track.imageUrl}
                    alt={translation?.title || ''}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Informações da trilha */}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">
                    {translation?.title || 'Sem título'}
                  </h4>
                  <p className="text-sm text-gray-400 line-clamp-1">
                    {translation?.description ||
                      'Sem descrição'}
                  </p>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Slug: {track.slug}</span>
                      <span>
                        ID: {track.id.slice(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        {track.translations.length}/3{' '}
                        {t('languages')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen
                        size={12}
                        className="text-gray-400"
                      />
                      <span className="text-gray-400">
                        {t('courses')}:
                      </span>
                      <span className="text-gray-300">
                        {coursesNames.join(', ')}
                      </span>
                    </div>
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
                    onClick={() => handleDelete(track.id)}
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
          <Route
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noTracks')}
          </p>
        </div>
      )}
    </div>
  );
}
