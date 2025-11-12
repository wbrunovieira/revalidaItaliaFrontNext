// /src/components/TrackEditModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Route,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  Save,
  Loader2,
  BookOpen,
  Check,
  Upload,
  ArrowRight,
  RefreshCw,
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

interface TrackCourse {
  courseId: string;
  course?: Course;
}

interface TrackEditData {
  id: string;
  slug: string;
  imageUrl: string;
  courseIds?: string[];
  trackCourses?: TrackCourse[];
  courses?: Course[];
  translations: Translation[];
}

interface TrackEditModalProps {
  track: TrackEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormTranslations {
  pt: Translation;
  es: Translation;
  it: Translation;
}

interface FormData {
  slug: string;
  imageUrl: string;
  newImageUrl: string;
  newImageFile: File | undefined;
  courseIds: string[];
  translations: FormTranslations;
}

interface FormErrors {
  [key: string]: string;
}

export default function TrackEditModal({
  track,
  isOpen,
  onClose,
  onSave,
}: TrackEditModalProps) {
  const t = useTranslations('Admin.trackEdit');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    imageUrl: '',
    newImageUrl: '',
    newImageFile: undefined,
    courseIds: [],
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [availableCourses, setAvailableCourses] = useState<
    Course[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImageName, setSavedImageName] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] =
    useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Função para obter o token
  const getAuthToken = (): string | null => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const tokenFromCookie = getCookie('token');
    const tokenFromLocal =
      localStorage.getItem('accessToken');
    const tokenFromSession =
      sessionStorage.getItem('accessToken');

    console.log('Token sources:', {
      cookie: tokenFromCookie ? 'Found' : 'Not found',
      localStorage: tokenFromLocal ? 'Found' : 'Not found',
      sessionStorage: tokenFromSession
        ? 'Found'
        : 'Not found',
    });

    return (
      tokenFromCookie || tokenFromLocal || tokenFromSession
    );
  };


  // Delete image from storage
  const deleteImage = useCallback(async (imageUrl: string) => {
    try {
      // Extract path from URL - assuming URL structure includes /images/tracks/filename
      const urlParts = imageUrl.split('/');
      const imagesIndex = urlParts.findIndex(part => part === 'images');
      if (imagesIndex === -1) {
        console.error('Could not extract path from URL');
        return false;
      }
      
      const path = urlParts.slice(imagesIndex).join('/');
      
      const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }, []);

  // Handle image selection (preview only, no upload)
  const handleImageSelection = useCallback(
    (file: File) => {
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.invalidImageType'),
        }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.imageTooLarge'),
        }));
        return;
      }

      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);

      // Save file and preview URL
      setFormData(prev => ({
        ...prev,
        newImageFile: file,
        newImageUrl: localUrl,
      }));

      setSavedImageName(file.name);
      
      // Clear image error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        return newErrors;
      });
    },
    [t]
  );

  // Remove new image selection
  const handleImageRemove = useCallback(() => {
    // Revoke the object URL to free memory
    if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.newImageUrl);
    }
    
    setFormData(prev => ({
      ...prev,
      newImageFile: undefined,
      newImageUrl: '',
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.imageUrl;
      return newErrors;
    });
    setSavedImageName(null);
  }, [formData.newImageUrl]);

  // Buscar cursos disponíveis
  const fetchAvailableCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar cursos');
      }

      const data: Course[] = await response.json();
      setAvailableCourses(data);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      toast({
        title: t('errors.fetchCoursesTitle'),
        description: t('errors.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Image is required (either original or new)
    if (!formData.imageUrl.trim() && !formData.newImageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
    }

    if (formData.courseIds.length === 0) {
      newErrors.courseIds = t('errors.coursesRequired');
    }

    // Validar traduções
    const locales = ['pt', 'es', 'it'] as const;
    locales.forEach(locale => {
      if (!formData.translations[locale].title.trim()) {
        newErrors[`title_${locale}`] = t(
          'errors.titleRequired'
        );
      }
      if (
        !formData.translations[locale].description.trim()
      ) {
        newErrors[`description_${locale}`] = t(
          'errors.descriptionRequired'
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função de teste para debug
  const testApiConnection = async (): Promise<void> => {
    try {
      console.log('Testando conexão com API...');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(
        'Teste GET /tracks:',
        response.status,
        response.ok
      );

      if (track) {
        const response2 = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks/${track.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(
          'Teste GET /tracks/{id}:',
          response2.status,
          response2.ok
        );
      }
    } catch (error) {
      console.error('Erro no teste de API:', error);
    }
  };

  // Submeter formulário
  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !track) return;

    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Se há uma nova imagem selecionada, fazer upload primeiro
      if (formData.newImageFile) {
        setUploadingImage(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.newImageFile);
        uploadFormData.append('category', 'image');
        uploadFormData.append('folder', 'tracks');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
        }

        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
        setUploadingImage(false);
      }

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Converter translations object para array
      const translations = Object.values(
        formData.translations
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks/${track.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            slug: track.slug, // Mantém o slug original, sem permitir edição
            imageUrl: finalImageUrl.trim(),
            courseIds: formData.courseIds,
            translations,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Não autorizado - faça login novamente'
          );
        } else if (response.status === 404) {
          throw new Error('Trilha não encontrada');
        } else if (response.status === 409) {
          throw new Error(
            'Já existe uma trilha com este slug'
          );
        }
        throw new Error('Erro ao atualizar trilha');
      }

      // Se havia uma nova imagem e a atualização foi bem-sucedida,
      // deletar a imagem antiga
      if (formData.newImageFile && formData.imageUrl && finalImageUrl !== formData.imageUrl) {
        await deleteImage(formData.imageUrl);
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar trilha:', error);
      toast({
        title: t('error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Extrair courseIds do track
  const extractCourseIds = (
    trackData: TrackEditData
  ): string[] => {
    if (
      trackData.courseIds &&
      Array.isArray(trackData.courseIds)
    ) {
      return trackData.courseIds;
    } else if (
      trackData.trackCourses &&
      Array.isArray(trackData.trackCourses)
    ) {
      return trackData.trackCourses.map(
        (tc: TrackCourse) => tc.courseId
      );
    } else if (
      trackData.courses &&
      Array.isArray(trackData.courses)
    ) {
      return trackData.courses.map((c: Course) => c.id);
    }
    return [];
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.newImageUrl);
      }
    };
  }, [formData.newImageUrl]);

  // Atualizar formulário quando track mudar
  useEffect(() => {
    if (track && isOpen) {
      // Clean up any existing blob URLs
      if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.newImageUrl);
      }

      const translationsObj: FormTranslations = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      track.translations.forEach(trans => {
        if (
          trans.locale === 'pt' ||
          trans.locale === 'es' ||
          trans.locale === 'it'
        ) {
          translationsObj[
            trans.locale as keyof FormTranslations
          ] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      const courseIds = extractCourseIds(track);

      setFormData({
        slug: track.slug,
        imageUrl: track.imageUrl || '',
        newImageUrl: '',
        newImageFile: undefined,
        courseIds: courseIds,
        translations: translationsObj,
      });
      setErrors({});
      setSavedImageName(null);
    }
  }, [track, isOpen, formData.newImageUrl]);

  // Buscar cursos quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCourses();
    }
  }, [isOpen, fetchAvailableCourses]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const updateTranslation = (
    locale: 'pt' | 'es' | 'it',
    field: 'title' | 'description',
    value: string
  ): void => {
    setFormData({
      ...formData,
      translations: {
        ...formData.translations,
        [locale]: {
          ...formData.translations[locale],
          [field]: value,
        },
      },
    });
  };

  const toggleCourse = (courseId: string): void => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
    // Limpar erro de courseIds quando selecionar pelo menos um curso
    if (errors.courseIds) {
      setErrors(prev => ({ ...prev, courseIds: '' }));
    }
  };

  const getTranslationByLocale = (
    translations: Translation[],
    targetLocale: string
  ): Translation => {
    return (
      translations.find(tr => tr.locale === targetLocale) ||
      translations[0]
    );
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route size={28} className="text-secondary" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="space-y-6">

            {/* Seção de Upload de Imagem */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                <ImageIcon size={16} className="inline mr-2" />
                {t('fields.trackImage')}
              </label>

              {/* Upload area if no image or new image */}
              {!formData.imageUrl && !formData.newImageUrl ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelection(file);
                    }}
                    className="hidden"
                    id="track-image-upload"
                  />
                  <label
                    htmlFor="track-image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors ${
                      errors.imageUrl
                        ? 'border-red-500'
                        : 'border-gray-600'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      {t('upload.clickToSelect')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('upload.supportedFormats')}: JPEG, PNG, GIF, WebP
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Original image preview (shown alone when no new image) */}
                  {formData.imageUrl && !formData.newImageUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">{t('image.current')}</p>
                      <div className="relative group">
                        <Image
                          src={formData.imageUrl}
                          alt="Current track image"
                          width={400}
                          height={224}
                          className="rounded-lg object-cover w-full h-56"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelection(file);
                            }}
                            className="hidden"
                            id="track-image-change"
                          />
                          <label
                            htmlFor="track-image-change"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-medium text-sm rounded-lg cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-lg"
                          >
                            <RefreshCw size={16} className="text-gray-700" />
                            {t('upload.change')}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual preview when new image selected */}
                  {formData.imageUrl && formData.newImageUrl && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-2">{t('image.original')}</p>
                        <Image
                          src={formData.imageUrl}
                          alt="Original track image"
                          width={200}
                          height={112}
                          className="rounded-lg object-cover w-full h-28"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                          <ArrowRight size={12} />
                          {t('image.new')}
                        </p>
                        <div className="relative group">
                          <Image
                            src={formData.newImageUrl}
                            alt="New track image"
                            width={200}
                            height={112}
                            className="rounded-lg object-cover w-full h-28 ring-2 ring-green-400"
                          />
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {savedImageName && (
                    <p className="text-xs text-gray-500">
                      {t('upload.savedAs')}: {savedImageName}
                    </p>
                  )}
                </div>
              )}

              {errors.imageUrl && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.imageUrl}
                </p>
              )}
            </div>

            {/* Seleção de Cursos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen size={20} />
                {t('courses.title')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('courses.description')}
              </p>

              {errors.courseIds && (
                <p className="text-red-400 text-sm">
                  {errors.courseIds}
                </p>
              )}

              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    size={32}
                    className="animate-spin text-gray-400"
                  />
                </div>
              ) : availableCourses.length > 0 ? (
                <div className="grid gap-3 max-h-48 overflow-y-auto p-2 bg-gray-700/30 rounded-lg">
                  {availableCourses.map(course => {
                    const courseTranslation =
                      getTranslationByLocale(
                        course.translations,
                        locale
                      );
                    const isSelected =
                      formData.courseIds.includes(
                        course.id
                      );

                    return (
                      <div
                        key={course.id}
                        onClick={() =>
                          toggleCourse(course.id)
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-secondary/20 border border-secondary'
                            : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <div className="relative w-12 h-9 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={course.imageUrl}
                            alt={
                              courseTranslation?.title || ''
                            }
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">
                            {courseTranslation?.title ||
                              'Sem título'}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {courseTranslation?.description ||
                              'Sem descrição'}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-secondary border-secondary'
                              : 'border-gray-500'
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-primary"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {t('courses.noCourses')}
                </p>
              )}
            </div>

            {/* Traduções */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe size={20} />
                {t('translations.title')}
              </h3>

              {/* Português */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇧🇷 {t('translations.portuguese')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.pt.title}
                      onChange={e =>
                        updateTranslation(
                          'pt',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_pt
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_pt && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_pt}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
                      value={
                        formData.translations.pt.description
                      }
                      onChange={e =>
                        updateTranslation(
                          'pt',
                          'description',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_pt
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_pt && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_pt}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Espanhol */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇪🇸 {t('translations.spanish')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.es.title}
                      onChange={e =>
                        updateTranslation(
                          'es',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_es
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_es && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_es}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
                      value={
                        formData.translations.es.description
                      }
                      onChange={e =>
                        updateTranslation(
                          'es',
                          'description',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_es
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_es && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_es}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Italiano */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇮🇹 {t('translations.italian')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.it.title}
                      onChange={e =>
                        updateTranslation(
                          'it',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_it
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_it && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_it}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
                      value={
                        formData.translations.it.description
                      }
                      onChange={e =>
                        updateTranslation(
                          'it',
                          'description',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_it
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_it && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_it}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={testApiConnection}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            Testar API
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || uploadingImage}
              className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading || uploadingImage ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}
              {uploadingImage ? t('upload.uploading') : loading ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
