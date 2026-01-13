// /src/components/ModuleEditModal.tsx

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
  Hash,
  Upload,
  ArrowRight,
  Lock,
  Unlock,
  Calendar,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

interface Module {
  id: string;
  slug: string;
  order: number;
  imageUrl?: string;
  immediateAccess?: boolean;
  unlockAfterDays?: number;
  translations: Translation[];
}

interface ModuleEditData {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  immediateAccess?: boolean;
  unlockAfterDays?: number;
  translations: Translation[];
}

interface ModuleEditModalProps {
  module: ModuleEditData | null;
  courseId: string;
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
  order: number;
  immediateAccess: boolean;
  unlockAfterDays: number | undefined;
  translations: FormTranslations;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export default function ModuleEditModal({
  module,
  courseId,
  isOpen,
  onClose,
  onSave,
}: ModuleEditModalProps) {
  const t = useTranslations('Admin.moduleEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    imageUrl: '',
    newImageUrl: '',
    newImageFile: undefined,
    order: 1,
    immediateAccess: true,
    unlockAfterDays: undefined,
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [loading, setLoading] = useState(false);
  const [savedImageName, setSavedImageName] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Novos estados para gerenciar orders
  const [existingOrders, setExistingOrders] = useState<
    number[]
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<
    number | null
  >(null);

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

  // Extract filename from URL
  const extractFilenameFromUrl = useCallback((url: string): string | null => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // If it looks like a filename (has extension), return it
      if (filename && filename.includes('.')) {
        return filename;
      }
    } catch (error) {
      console.error('Error extracting filename:', error);
    }
    return null;
  }, []);

  // Delete image from storage
  const deleteImage = useCallback(async (imageUrl: string) => {
    try {
      // Extract path from URL - assuming URL structure includes /images/modules/filename
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

  // Função para buscar módulos existentes do curso
  const fetchExistingModules = useCallback(
    async (courseId: string) => {
      setLoadingOrders(true);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3333';
        const token = getAuthToken();
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch modules: ${response.status}`
          );
        }

        const modules: Module[] = await response.json();
        const orders = modules.map(
          (module: Module) => module.order
        );
        setExistingOrders(orders);

        console.log('Orders existentes no curso:', orders);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setExistingOrders([]);
        toast({
          title: 'Erro ao carregar módulos',
          description:
            'Não foi possível carregar os módulos existentes do curso.',
          variant: 'destructive',
        });
      } finally {
        setLoadingOrders(false);
      }
    },
    [toast]
  );

  // Função para gerar lista de ordens disponíveis
  const getAvailableOrders = useCallback((): number[] => {
    const maxOrder = 50; // Limite máximo de ordem
    const availableOrders = [];

    for (let i = 1; i <= maxOrder; i++) {
      // Incluir o order original (do módulo sendo editado) mesmo que já exista
      // Excluir outros orders que já existem
      if (
        !existingOrders.includes(i) ||
        i === originalOrder
      ) {
        availableOrders.push(i);
      }
    }

    return availableOrders;
  }, [existingOrders, originalOrder]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Image is required (either original or new)
    if (!formData.imageUrl.trim() && !formData.newImageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
    }

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

    // Validar unlockAfterDays (obrigatório quando immediateAccess é false)
    if (!formData.immediateAccess) {
      if (!formData.unlockAfterDays || formData.unlockAfterDays < 1) {
        newErrors.unlockAfterDays = t('errors.unlockAfterDaysRequired');
      } else if (formData.unlockAfterDays > 365) {
        newErrors.unlockAfterDays = t('errors.unlockAfterDaysMax');
      }
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

  // Generate unique filename
  const generateUniqueFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    const cleanName = originalName.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${cleanName}-${timestamp}-${randomString}.${extension}`;
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const uniqueFileName = generateUniqueFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'image');
    formData.append('folder', 'modules');
    formData.append('filename', uniqueFileName);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  // Submeter formulário
  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !module) return;

    setLoading(true);
    let newUploadedUrl: string | null = null;
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      // If there's a new image to upload
      if (formData.newImageFile) {
        toast({
          title: t('upload.uploading'),
          description: formData.newImageFile.name,
        });
        
        try {
          // Upload the new image
          newUploadedUrl = await uploadImage(formData.newImageFile);
          finalImageUrl = newUploadedUrl;
          
          toast({
            title: t('upload.success'),
            description: extractFilenameFromUrl(newUploadedUrl) || '',
          });
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            title: t('error.uploadTitle'),
            description: t('error.uploadDescription'),
            variant: 'destructive',
          });
          return;
        } finally {
        }
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

      // Build payload with access control fields
      const payload: {
        slug: string;
        imageUrl: string;
        order: number;
        translations: Translation[];
        immediateAccess?: boolean;
        unlockAfterDays?: number;
      } = {
        slug: module.slug, // Mantém o slug original, sem permitir edição
        imageUrl: finalImageUrl.trim(),
        order: formData.order,
        translations,
      };

      // Add access control fields
      if (formData.immediateAccess) {
        payload.immediateAccess = true;
      } else {
        payload.immediateAccess = false;
        payload.unlockAfterDays = formData.unlockAfterDays;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${module.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Não autorizado - faça login novamente'
          );
        } else if (response.status === 404) {
          throw new Error('Módulo não encontrado');
        } else if (response.status === 409) {
          throw new Error(
            'Já existe um módulo com este slug ou ordem'
          );
        }
        throw new Error('Erro ao atualizar módulo');
      }

      // If update was successful and we uploaded a new image, delete the old one
      if (newUploadedUrl && formData.imageUrl && formData.imageUrl !== newUploadedUrl) {
        // Delete old image in background (don't wait for it)
        deleteImage(formData.imageUrl).catch(error => {
          console.error('Error deleting old image:', error);
        });
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
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
    }
  };

  // Handler para mudança de order
  const handleOrderChange = useCallback(
    (value: string) => {
      const order = parseInt(value) || 1;
      setFormData(prev => ({ ...prev, order }));

      // Validar order em tempo real
      if (
        existingOrders.includes(order) &&
        order !== originalOrder
      ) {
        setErrors(prev => ({
          ...prev,
          order: t('errors.orderExists'),
        }));
      } else {
        setErrors(prev => ({ ...prev, order: undefined }));
      }
    },
    [existingOrders, originalOrder, t]
  );

  // Handler para mudança de immediateAccess
  const handleImmediateAccessChange = useCallback(
    (checked: boolean) => {
      setFormData(prev => ({
        ...prev,
        immediateAccess: checked,
        // Clear unlockAfterDays when switching to immediate access
        unlockAfterDays: checked ? undefined : prev.unlockAfterDays,
      }));
      // Clear unlockAfterDays error when switching to immediate access
      if (checked) {
        setErrors(prev => ({ ...prev, unlockAfterDays: undefined }));
      }
    },
    []
  );

  // Handler para mudança de unlockAfterDays
  const handleUnlockAfterDaysChange = useCallback(
    (value: string) => {
      const days = value ? parseInt(value) : undefined;
      setFormData(prev => ({
        ...prev,
        unlockAfterDays: days,
      }));
      // Validar em tempo real
      if (!formData.immediateAccess) {
        if (!days || days < 1) {
          setErrors(prev => ({
            ...prev,
            unlockAfterDays: t('errors.unlockAfterDaysRequired'),
          }));
        } else if (days > 365) {
          setErrors(prev => ({
            ...prev,
            unlockAfterDays: t('errors.unlockAfterDaysMax'),
          }));
        } else {
          setErrors(prev => ({ ...prev, unlockAfterDays: undefined }));
        }
      }
    },
    [formData.immediateAccess, t]
  );

  // Atualizar formulário quando module mudar
  useEffect(() => {
    if (module && isOpen && courseId) {
      const translationsObj: FormTranslations = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      module.translations.forEach(trans => {
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

      setFormData({
        slug: module.slug,
        imageUrl: module.imageUrl || '',
        newImageUrl: '',
        newImageFile: undefined,
        order: module.order || 1,
        immediateAccess: module.immediateAccess !== false, // Default to true if undefined
        unlockAfterDays: module.unlockAfterDays,
        translations: translationsObj,
      });

      // Armazenar o order original
      setOriginalOrder(module.order || 1);
      setErrors({});

      // Buscar módulos existentes do curso
      fetchExistingModules(courseId);
    }
  }, [module, isOpen, courseId, fetchExistingModules]);

  // Cleanup blob URLs when modal closes
  useEffect(() => {
    return () => {
      if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.newImageUrl);
      }
    };
  }, [formData.newImageUrl]);

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

  if (!isOpen || !module) return null;

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
            {/* Informações básicas */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Order - Agora como Select */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Hash size={16} className="inline mr-2" />
                  {t('fields.order')}
                </label>
                {loadingOrders ? (
                  <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                    <Loader2
                      size={16}
                      className="animate-spin inline mr-2"
                    />
                    Carregando ordens...
                  </div>
                ) : (
                  <Select
                    value={formData.order.toString()}
                    onValueChange={handleOrderChange}
                    disabled={loadingOrders}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue
                        placeholder={t(
                          'placeholders.order'
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                      {getAvailableOrders().length === 0 ? (
                        <div className="px-2 py-4 text-center text-gray-400 text-sm">
                          Nenhuma ordem disponível
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
                                (atual)
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.order && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.order}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {t('hints.order')}
                </p>
                {existingOrders.length > 0 &&
                  !loadingOrders && (
                    <p className="text-xs text-gray-400 mt-1">
                      Ordens ocupadas:{' '}
                      {existingOrders
                        .filter(o => o !== originalOrder)
                        .sort((a, b) => a - b)
                        .join(', ')}
                    </p>
                  )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon
                    size={16}
                    className="inline mr-2"
                  />
                  {t('moduleImage')}
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
                      id="module-image-upload"
                    />
                    <label
                      htmlFor="module-image-upload"
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
                    {/* Original image preview */}
                    {formData.imageUrl && !formData.newImageUrl && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">{t('image.current')}</p>
                        <div className="relative group">
                          <Image
                            src={formData.imageUrl}
                            alt="Current module image"
                            width={200}
                            height={112}
                            className="rounded-lg object-cover w-full h-28"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageSelection(file);
                              }}
                              className="hidden"
                              id="module-image-change"
                            />
                            <label
                              htmlFor="module-image-change"
                              className="px-3 py-1 bg-white text-black text-sm rounded cursor-pointer hover:bg-gray-200"
                            >
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
                            alt="Original module image"
                            width={200}
                            height={112}
                            className="rounded-lg object-cover w-full h-20"
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
                              alt="New module image"
                              width={200}
                              height={112}
                              className="rounded-lg object-cover w-full h-20 ring-2 ring-green-400"
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
            </div>

            {/* Access Control */}
            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                {formData.immediateAccess ? (
                  <Unlock size={20} className="text-green-400" />
                ) : (
                  <Lock size={20} className="text-yellow-400" />
                )}
                {t('accessControl.title')}
              </h3>

              <div className="space-y-4">
                {/* Immediate Access Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-gray-300 flex items-center gap-2">
                      {t('accessControl.immediateAccess')}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('accessControl.immediateAccessHint')}
                    </p>
                  </div>
                  <Switch
                    checked={formData.immediateAccess}
                    onCheckedChange={handleImmediateAccessChange}
                  />
                </div>

                {/* Unlock After Days - Only visible when immediateAccess is false */}
                {!formData.immediateAccess && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <Calendar size={16} />
                      {t('accessControl.unlockAfterDays')}
                      <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.unlockAfterDays || ''}
                        onChange={(e) => handleUnlockAfterDaysChange(e.target.value)}
                        className={`w-24 px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.unlockAfterDays ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="7"
                      />
                      <span className="text-gray-400 text-sm">
                        {t('accessControl.days')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('accessControl.unlockAfterDaysHint')}
                    </p>
                    {errors.unlockAfterDays && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.unlockAfterDays}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
        <div className="flex items-center justify-end p-6 border-t border-gray-700 flex-shrink-0">
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
              disabled={loading || loadingOrders}
              className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
