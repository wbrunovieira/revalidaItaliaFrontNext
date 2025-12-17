// /src/components/TracksList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Hash,
} from 'lucide-react';
import Image from 'next/image';
import TrackViewModal from './TrackViewModal';
import TrackEditModal from './TrackEditModal';

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

interface TrackCourse {
  course: Course;
  courseId: string;
}

interface TrackCourseWithOptionalCourse {
  courseId: string;
  course?: Course;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  translations: Translation[];
  courses?: Course[];
  courseIds?: string[];
  trackCourses?: TrackCourse[];
  createdAt: string;
  updatedAt: string;
}

interface TrackForEdit {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  translations: Translation[];
  courses?: Course[];
  courseIds: string[];
  trackCourses?: TrackCourseWithOptionalCourse[];
  createdAt: string;
  updatedAt: string;
}

export default function TracksList() {
  const t = useTranslations('Admin.tracksList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<
    string | null
  >(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTrackForEdit, setSelectedTrackForEdit] =
    useState<TrackForEdit | null>(null);

  const getTranslationByLocale = useCallback(
    (
      translations: Translation[],
      targetLocale: string
    ): Translation => {
      return (
        translations.find(
          tr => tr.locale === targetLocale
        ) || translations[0]
      );
    },
    []
  );

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      }
    },
    []
  );

  // Função principal para buscar todos os dados
  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Move apiUrl inside the useCallback to avoid dependency warning
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const tracksResponse = await fetch(
        `${apiUrl}/api/v1/tracks`
      );

      if (!tracksResponse.ok) {
        throw new Error(
          `Failed to fetch tracks: ${tracksResponse.status}`
        );
      }

      const tracksData: Track[] =
        await tracksResponse.json();

      // Processar as tracks para garantir que tenham o campo courses
      const processedTracks = tracksData.map(track => {
        // Se os cursos vierem em trackCourses, extrair deles
        let courses: Course[] = [];

        if (track.courses && Array.isArray(track.courses)) {
          courses = track.courses;
        } else if (
          track.trackCourses &&
          Array.isArray(track.trackCourses)
        ) {
          // Se os cursos vierem aninhados em trackCourses
          courses = track.trackCourses
            .map(tc => tc.course)
            .filter(
              (course): course is Course => course != null
            );
        }

        return {
          ...track,
          courses,
        };
      });

      setTracks(processedTracks);
    } catch (error) {
      handleApiError(error, 'Tracks fetch error');
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t, handleApiError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para deletar trilha após confirmação
  const deleteTrack = useCallback(
    async (trackId: string) => {
      try {
        // Primeiro, buscar os dados da trilha para obter a URL da imagem
        const track = tracks.find(t => t.id === trackId);
        
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/tracks/${trackId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete track: ${response.status}`
          );
        }

        // Se a trilha foi deletada com sucesso e tem uma imagem, tentar deletar a imagem
        if (track?.imageUrl && track.imageUrl.startsWith('/uploads/')) {
          try {
            // Extrair o path relativo da imagem
            const imagePath = track.imageUrl.replace('/uploads/', '');
            
            const deleteImageResponse = await fetch(`/api/upload?path=${encodeURIComponent(imagePath)}`, {
              method: 'DELETE',
            });
            
            if (!deleteImageResponse.ok) {
              console.error('Failed to delete track image:', imagePath);
            }
          } catch (imageError) {
            console.error('Error deleting track image:', imageError);
            // Não falhar a operação toda se a imagem não puder ser deletada
          }
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
          variant: 'success',
        });

        await fetchData();
      } catch (error) {
        handleApiError(error, 'Track deletion error');
        toast({
          title: t('error.deleteTitle'),
          description: t('error.deleteDescription'),
          variant: 'destructive',
        });
      }
    },
    [t, toast, fetchData, handleApiError, tracks]
  );

  // Função para mostrar confirmação personalizada usando toast
  const handleDelete = useCallback(
    async (trackId: string) => {
      const track = tracks.find(t => t.id === trackId);
      if (!track) return;

      const trackTranslation = getTranslationByLocale(
        track.translations,
        locale
      );
      const courseCount = track.courses?.length || 0;

      // Toast de confirmação personalizado
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', {
                trackName:
                  trackTranslation?.title || 'Sem título',
              })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Route size={14} />
                  {t('deleteConfirmation.slug')}:{' '}
                  {track.slug}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t('deleteConfirmation.courses')}:{' '}
                  {courseCount}{' '}
                  {courseCount === 1
                    ? t('deleteConfirmation.course')
                    : t('deleteConfirmation.coursesPlural')}
                </div>
                <div>
                  📅 {t('deleteConfirmation.created')}:{' '}
                  {new Date(
                    track.createdAt
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
            <p className="text-xs text-red-300 font-medium">
              ⚠️ {t('deleteConfirmation.warning')}
            </p>
          </div>
        ),
        variant: 'destructive',
        action: (
          <div className="flex gap-2">
            <button
              onClick={() => deleteTrack(trackId)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              {t('deleteConfirmation.confirm')}
            </button>
          </div>
        ),
      });
    },
    [
      toast,
      deleteTrack,
      tracks,
      t,
      locale,
      getTranslationByLocale,
    ] // Added getTranslationByLocale
  );

  const handleView = useCallback(
    (trackId: string): void => {
      setSelectedTrackId(trackId);
      setViewModalOpen(true);
    },
    []
  );

  const handleEdit = useCallback(
    async (trackId: string): Promise<void> => {
      try {
        // Buscar detalhes completos da trilha
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/tracks/${trackId}`
        );

        if (!response.ok) {
          throw new Error(
            'Erro ao buscar detalhes da trilha'
          );
        }

        const trackData: TrackForEdit =
          await response.json();
        console.log(
          'Dados da trilha para edição:',
          trackData
        );

        // Processar os dados para garantir que tenham o formato correto
        const processedTrack: TrackForEdit = {
          ...trackData,
          courseIds: trackData.courseIds || [],
        };

        // Se courseIds estiver vazio, tentar extrair de outras fontes
        if (processedTrack.courseIds.length === 0) {
          if (
            trackData.trackCourses &&
            Array.isArray(trackData.trackCourses)
          ) {
            processedTrack.courseIds =
              trackData.trackCourses.map(
                (tc: TrackCourseWithOptionalCourse) =>
                  tc.courseId
              );
          } else if (
            trackData.courses &&
            Array.isArray(trackData.courses)
          ) {
            processedTrack.courseIds =
              trackData.courses.map((c: Course) => c.id);
          }
        }

        setSelectedTrackForEdit(processedTrack);
        setEditModalOpen(true);
      } catch (error) {
        console.error(
          'Erro ao carregar trilha para edição:',
          error
        );
        toast({
          title: 'Erro ao carregar trilha',
          description:
            'Não foi possível carregar os dados da trilha para edição',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Filtrar trilhas baseado na busca
  const filteredTracks = tracks.filter(track => {
    const trackTranslation = getTranslationByLocale(
      track.translations,
      locale
    );
    const trackMatches =
      track.slug
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trackTranslation?.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trackTranslation?.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (trackMatches) return true;

    // Verificar se algum curso da trilha corresponde
    return track.courses?.some(course => {
      const courseTranslation = getTranslationByLocale(
        course.translations,
        locale
      );
      return (
        course.slug
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        courseTranslation?.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  });

  // Estatísticas
  const totalTracks = tracks.length;
  const totalCourses = tracks.reduce(
    (sum, tr) => sum + (tr.courseIds?.length ?? 0),
    0
  );
  const averageCoursesPerTrack =
    totalTracks > 0
      ? Math.round(totalCourses / totalTracks)
      : 0;

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Route size={24} className="text-secondary" />
            {t('title')}
          </h3>
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value=""
              disabled
              readOnly
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 opacity-50 cursor-not-allowed"
              placeholder={t('searchPlaceholder')}
            />
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 size={24} className="animate-spin text-secondary" />
            <span className="text-gray-400">{t('loading')}</span>
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
            {totalTracks}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.total')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalCourses}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalCourses')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {averageCoursesPerTrack}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.averageCourses')}
          </p>
        </div>
      </div>

      {/* Lista de trilhas */}
      {filteredTracks.length > 0 ? (
        <div className="space-y-4">
          {filteredTracks.map(track => {
            const trackTranslation = getTranslationByLocale(
              track.translations,
              locale
            );
            const courseCount = track.courses?.length || 0;

            return (
              <div
                key={track.id}
                className="border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-4 p-4 bg-gray-700/30">
                  {/* Imagem da trilha */}
                  <div className="relative w-20 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={track.imageUrl}
                      alt={trackTranslation?.title || ''}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Informações da trilha */}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {trackTranslation?.title ||
                        'Sem título'}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                      {trackTranslation?.description ||
                        'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Hash size={12} />
                        {t('order')}: {track.order}
                      </span>
                      <span>Slug: {track.slug}</span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {totalCourses} {t('courses')}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(track.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                      title={t('actions.view')}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(track.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                      title={t('actions.edit')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(track.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                      title={t('actions.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Lista de cursos da trilha */}
                {courseCount > 0 && (
                  <div className="bg-gray-800/50 p-4">
                    <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                      <BookOpen size={16} />
                      {t('coursesInTrack')} ({courseCount})
                    </h5>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {track.courses?.map(course => {
                        const courseTranslation =
                          getTranslationByLocale(
                            course.translations,
                            locale
                          );

                        return (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="relative w-10 h-8 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={course.imageUrl}
                                alt={
                                  courseTranslation?.title ||
                                  ''
                                }
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {courseTranslation?.title ||
                                  'Sem título'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {course.slug}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

      {/* Modal de Visualização */}
      <TrackViewModal
        trackId={selectedTrackId}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedTrackId(null);
        }}
      />

      {/* Modal de Edição */}
      <TrackEditModal
        track={selectedTrackForEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTrackForEdit(null);
        }}
        onSave={() => {
          setEditModalOpen(false);
          setSelectedTrackForEdit(null);
          fetchData();
        }}
      />
    </div>
  );
}
