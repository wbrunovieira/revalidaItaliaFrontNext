// /src/components/CourseEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  X,
  BookOpen,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  Save,
  Loader2,
  Upload,
  ArrowRight,
  RefreshCw,
  Hash,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  slug: string;
  order: number;
  imageUrl?: string;
  translations: Translation[];
}

interface CourseEditData {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  translations: Translation[];
}

interface CourseEditModalProps {
  course: CourseEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CourseEditModal({
  course,
  isOpen,
  onClose,
  onSave,
}: CourseEditModalProps) {
  const t = useTranslations('Admin.courseEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    imageUrl: '',
    newImageUrl: '',
    newImageFile: undefined as File | undefined,
    order: 1,
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImageName, setSavedImageName] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  // Estados para gerenciar orders
  const [existingOrders, setExistingOrders] = useState<number[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<number | null>(null);

  // Função para obter o token
  const getAuthToken = () => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };

    return (
      getCookie('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken')
    );
  };


  // Função para obter token do cookie
  const getToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }, []);

  // Função para buscar cursos existentes
  const fetchExistingCourses = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const token = getToken();
      const response = await fetch(`${apiUrl}/api/v1/courses`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const courses: Course[] = await response.json();
      const orders = courses.map((course: Course) => course.order);
      setExistingOrders(orders);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setExistingOrders([]);
      toast({
        title: t('error.fetchOrdersTitle'),
        description: t('error.fetchOrdersDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingOrders(false);
    }
  }, [toast, t, getToken]);

  // Função para gerar lista de ordens disponíveis
  const getAvailableOrders = useCallback((): number[] => {
    const maxOrder = 50;
    const availableOrders = [];

    for (let i = 1; i <= maxOrder; i++) {
      if (!existingOrders.includes(i) || i === originalOrder) {
        availableOrders.push(i);
      }
    }

    return availableOrders;
  }, [existingOrders, originalOrder]);

  // Handler para mudança de order
  const handleOrderChange = useCallback(
    (value: string) => {
      const order = parseInt(value) || 1;
      setFormData(prev => ({ ...prev, order }));

      if (existingOrders.includes(order) && order !== originalOrder) {
        setErrors(prev => ({
          ...prev,
          order: t('errors.orderExists'),
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.order;
          return newErrors;
        });
      }
    },
    [existingOrders, originalOrder, t]
  );

  // Delete image from storage
  const deleteImage = useCallback(async (imageUrl: string) => {
    try {
      // Extract path from URL - assuming URL structure includes /images/courses/filename
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

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Image is required (either original or new)
    if (!formData.imageUrl.trim() && !formData.newImageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
    }

    // Validar order
    if (formData.order < 1) {
      newErrors.order = t('errors.orderRequired');
    } else if (formData.order > 999) {
      newErrors.order = t('errors.orderMax');
    } else if (
      existingOrders.includes(formData.order) &&
      formData.order !== originalOrder
    ) {
      newErrors.order = t('errors.orderExists');
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

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !course) return;

    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Se há uma nova imagem selecionada, fazer upload primeiro
      if (formData.newImageFile) {
        setUploadingImage(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.newImageFile);
        uploadFormData.append('category', 'image');
        uploadFormData.append('folder', 'courses');

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            slug: course.slug, // Mantém o slug original, sem permitir edição
            imageUrl: finalImageUrl.trim(),
            order: formData.order,
            translations,
          }),
        }
      );

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = 'Erro ao atualizar curso';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch {
          // If can't parse JSON, use generic message based on status
        }

        if (response.status === 401) {
          throw new Error('Não autorizado - faça login novamente');
        } else if (response.status === 404) {
          throw new Error('Curso não encontrado');
        } else if (response.status === 409) {
          throw new Error('Já existe um curso com este slug');
        }

        throw new Error(errorMessage);
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
      console.error('Erro ao atualizar curso:', error);
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.newImageUrl);
      }
    };
  }, [formData.newImageUrl]);

  // Atualizar formulário quando course mudar
  useEffect(() => {
    if (course && isOpen) {
      const translationsObj = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      course.translations.forEach(trans => {
        if (
          trans.locale === 'pt' ||
          trans.locale === 'es' ||
          trans.locale === 'it'
        ) {
          translationsObj[trans.locale] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      setFormData({
        slug: course.slug,
        imageUrl: course.imageUrl,
        newImageUrl: '',
        newImageFile: undefined,
        order: course.order || 1,
        translations: translationsObj,
      });

      // Armazenar o order original
      setOriginalOrder(course.order || 1);
      setErrors({});
      setSavedImageName(null);

      // Buscar cursos existentes para validação de order
      fetchExistingCourses();
    }
  }, [course, isOpen, fetchExistingCourses]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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
  ) => {
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

  if (!isOpen || !course) return null;

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
            <BookOpen
              size={28}
              className="text-secondary"
            />
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

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Hash size={16} className="inline mr-2" />
                {t('fields.order')}
              </label>
              {loadingOrders ? (
                <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                  <Loader2 size={16} className="animate-spin inline mr-2" />
                  {t('loadingOrders')}
                </div>
              ) : (
                <Select
                  value={formData.order.toString()}
                  onValueChange={handleOrderChange}
                  disabled={loadingOrders}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-full md:w-48">
                    <SelectValue placeholder={t('placeholders.order')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                    {getAvailableOrders().length === 0 ? (
                      <div className="px-2 py-4 text-center text-gray-400 text-sm">
                        {t('noOrdersAvailable')}
                      </div>
                    ) : (
                      getAvailableOrders().map(order => (
                        <SelectItem
                          key={order}
                          value={order.toString()}
                          className="text-white hover:bg-gray-600"
                        >
                          {order}
                          {order === originalOrder && (
                            <span className="text-xs text-gray-400 ml-2">
                              ({t('currentOrder')})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {errors.order && (
                <p className="text-red-400 text-sm mt-1">{errors.order}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{t('hints.order')}</p>
              {existingOrders.length > 0 && !loadingOrders && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('occupiedOrders')}: {existingOrders
                    .filter(o => o !== originalOrder)
                    .sort((a, b) => a - b)
                    .join(', ') || t('none')}
                </p>
              )}
            </div>

            {/* Seção de Upload de Imagem */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                <ImageIcon size={16} className="inline mr-2" />
                {t('fields.courseImage')}
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
                    id="course-image-upload"
                  />
                  <label
                    htmlFor="course-image-upload"
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
                          alt="Current course image"
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
                            id="course-image-change"
                          />
                          <label
                            htmlFor="course-image-change"
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
                          alt="Original course image"
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
                            alt="New course image"
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
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
            disabled={loading || uploadingImage || loadingOrders}
            className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading || uploadingImage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {uploadingImage ? t('upload.uploading') : loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
