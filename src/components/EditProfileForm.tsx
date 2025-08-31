// /src/components/EditProfileForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR, it, es } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import {
  User,
  Mail,
  Hash,
  Phone,
  Calendar,
  Camera,
  Check,
  X,
  Briefcase,
  BookOpen,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Trash2,
  Upload,
  File,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  nationalId: string;
  phone?: string | null;
  birthDate?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  communityProfileConsent: boolean;
  curriculumUrl?: string | null;
  hasEuropeanCitizenship?: boolean;
  role: string;
}

interface EditProfileFormProps {
  userData: UserData;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditProfileForm({
  userData,
  onCancel,
  onSuccess,
}: EditProfileFormProps) {
  const t = useTranslations('Profile');
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const params = useParams();
  const locale = params.locale as string;
  
  // Configurar locale do date picker
  const dateLocale = locale === 'pt' ? ptBR : locale === 'it' ? it : es;
  
  // Estado para o telefone - remover o + inicial se existir
  const initialPhone = userData.phone?.replace(/^\+/, '') || '';
  const [phoneValue, setPhoneValue] = useState(initialPhone);
  
  // Estado para a data de nascimento
  const [birthDate, setBirthDate] = useState<Date | null>(
    userData.birthDate ? new Date(userData.birthDate) : null
  );

  // Estados para os novos campos
  const [communityConsent, setCommunityConsent] = useState(
    userData.communityProfileConsent || false
  );
  const [hasEuropeanCitizenship, setHasEuropeanCitizenship] = useState(
    userData.hasEuropeanCitizenship || false
  );
  
  // Estados para upload de imagem
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    userData.profileImageUrl || null
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    userData.profileImageUrl || null
  );
  
  // Estados para upload de currículo
  const [uploadingCurriculum, setUploadingCurriculum] = useState(false);
  const [curriculumUrl, setCurriculumUrl] = useState<string | null>(
    userData.curriculumUrl || null
  );
  const [curriculumFileName, setCurriculumFileName] = useState<string | null>(null);

  // Schema de validação com Zod
  const profileSchema = z.object({
    name: z.string().min(3, { message: t('validation.nameMin') }),
    birthDate: z.string().optional(),
    bio: z.string().max(500, { message: t('validation.bioMax') }).optional(),
    profession: z.string().max(100, { message: t('validation.professionMax') }).optional(),
    specialization: z.string().max(100, { message: t('validation.specializationMax') }).optional(),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  interface UpdateData {
    name?: string;
    phone?: string;
    birthDate?: string;
    profileImageUrl?: string;
    bio?: string;
    profession?: string;
    specialization?: string;
    communityProfileConsent?: boolean;
    curriculumUrl?: string;
    hasEuropeanCitizenship?: boolean;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData.name,
      birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : '',
      bio: userData.bio || '',
      profession: userData.profession || '',
      specialization: userData.specialization || '',
    },
  });

  // Função para fazer upload da imagem
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('error.title'),
        description: t('errors.invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho do arquivo (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t('error.title'),
        description: t('errors.imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Fazer upload para o servidor
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');
      formData.append('folder', 'profiles');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Salvar URL da imagem carregada
      setUploadedImageUrl(result.url);
      
      toast({
        title: t('success'),
        description: t('imageUploadSuccess'),
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('errors.uploadFailed'),
        variant: 'destructive',
      });
      // Reverter preview em caso de erro
      setImagePreview(userData.profileImageUrl || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  // Função para fazer upload do currículo
  const handleCurriculumUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo (PDF, DOC, DOCX)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('error.title'),
        description: t('errors.invalidCurriculumType') || 'Please upload a PDF or Word document',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho do arquivo (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: t('error.title'),
        description: t('errors.curriculumTooLarge') || 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingCurriculum(true);
      
      // Salvar nome do arquivo
      setCurriculumFileName(file.name);
      
      // Fazer upload para o servidor
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'document');
      formData.append('folder', 'curriculums');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Salvar URL do currículo carregado
      setCurriculumUrl(result.url);
      
      toast({
        title: t('success'),
        description: t('curriculumUploadSuccess') || 'Curriculum uploaded successfully',
      });
    } catch (error) {
      console.error('Curriculum upload error:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('errors.uploadFailed'),
        variant: 'destructive',
      });
      // Reverter em caso de erro
      setCurriculumUrl(userData.curriculumUrl || null);
      setCurriculumFileName(null);
    } finally {
      setUploadingCurriculum(false);
    }
  };

  const handleRemoveCurriculum = () => {
    setCurriculumUrl(null);
    setCurriculumFileName(null);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      // Preparar dados para envio (apenas campos alterados)
      const updateData: UpdateData = {};
      
      if (data.name !== userData.name)
        updateData.name = data.name;
      
      // Formatar telefone com +
      const formattedPhone = phoneValue ? `+${phoneValue}` : '';
      if (formattedPhone !== (userData.phone || ''))
        updateData.phone = formattedPhone;
        
      // Formatar data de nascimento
      const formattedBirthDate = birthDate ? birthDate.toISOString().split('T')[0] : '';
      if (formattedBirthDate !== (userData.birthDate?.split('T')[0] || '')) {
        updateData.birthDate = formattedBirthDate;
      }
      
      // Adicionar URL da imagem se foi alterada
      if (uploadedImageUrl !== userData.profileImageUrl) {
        updateData.profileImageUrl = uploadedImageUrl || '';
      }
      if (data.bio !== (userData.bio || '')) {
        updateData.bio = data.bio;
      }
      if (data.profession !== (userData.profession || '')) {
        updateData.profession = data.profession;
      }
      if (data.specialization !== (userData.specialization || '')) {
        updateData.specialization = data.specialization;
      }
      if (communityConsent !== userData.communityProfileConsent) {
        updateData.communityProfileConsent = communityConsent;
      }
      
      // Adicionar URL do currículo se foi alterada
      if (curriculumUrl !== userData.curriculumUrl) {
        updateData.curriculumUrl = curriculumUrl || '';
      }
      
      // Adicionar cidadania europeia se foi alterada
      if (hasEuropeanCitizenship !== userData.hasEuropeanCitizenship) {
        updateData.hasEuropeanCitizenship = hasEuropeanCitizenship;
      }

      // Se não há alterações
      if (Object.keys(updateData).length === 0) {
        toast({
          title: t('noChanges'),
          description: t('noChangesDescription'),
        });
        onCancel();
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Tratamento de erros específicos
        if (response.status === 400) {
          if (responseData.message?.includes('email')) {
            throw new Error(t('error.emailInvalid'));
          }
          if (responseData.message?.includes('CPF')) {
            throw new Error(t('error.cpfInvalid'));
          }
          if (responseData.message?.includes('Name')) {
            throw new Error(t('error.nameMin'));
          }
          if (responseData.message?.includes('URL')) {
            throw new Error(t('error.urlInvalid'));
          }
          if (responseData.message?.includes('campo')) {
            throw new Error(t('error.atLeastOneField'));
          }
        }
        
        if (response.status === 409) {
          if (responseData.message?.includes('Email')) {
            throw new Error(t('error.emailInUse'));
          }
          if (responseData.message?.includes('CPF')) {
            throw new Error(t('error.cpfInUse'));
          }
        }
        
        if (response.status === 401) {
          throw new Error(t('error.sessionExpired'));
        }
        
        throw new Error(responseData.message || t('error.updateFailed'));
      }

      // Sucesso
      toast({
        title: t('updateSuccess'),
        description: t('updateSuccessDescription'),
      });
      
      // Atualizar o Auth Store com os novos dados do usuário
      updateUser(updateData);
      
      onSuccess();
      
      // Recarregar a página para mostrar os dados atualizados
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.updateFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Avatar e Upload */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-center">
          <div className="relative">
            <Image
              src={
                imagePreview ||
                userData.profileImageUrl ||
                '/icons/avatar.svg'
              }
              alt={userData.name}
              width={120}
              height={120}
              className="rounded-full border-4 border-secondary object-cover bg-white"
            />
            {imagePreview && imagePreview !== userData.profileImageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                title={t('removePhoto')}
              >
                <Trash2 size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Botão de Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <input
              id="imageUpload"
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
              disabled={uploadingImage}
            />
            <label
              htmlFor="imageUpload"
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>{t('uploading')}</span>
                </>
              ) : (
                <>
                  <Camera size={20} />
                  <span>{t('changePhoto')}</span>
                </>
              )}
            </label>
          </div>
        </div>
        
        {/* Informações sobre o upload */}
        <p className="text-xs text-gray-400 text-center">
          {t('upload.supportedFormats')}: JPG, PNG, GIF, WebP (Max 5MB)
        </p>
      </div>

      {/* Campos do formulário */}
      <div className="space-y-4">
        {/* Nome */}
        <div className="flex items-start gap-3 text-white">
          <User size={20} className="text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{t('name')}</p>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Email - Não editável */}
        <div className="flex items-start gap-3 text-white">
          <Mail size={20} className="text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{t('email')}</p>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-gray-400">
              {userData.email}
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('emailNotEditable')}</p>
          </div>
        </div>

        {/* CPF - Não editável */}
        <div className="flex items-start gap-3 text-white">
          <Hash size={20} className="text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{t('cpf')}</p>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-gray-400">
              {userData.nationalId || userData.cpf || '-'}
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('cpfNotEditable')}</p>
          </div>
        </div>

        {/* Telefone com input internacional */}
        <div className="flex items-start gap-3 text-white">
          <Phone size={20} className="text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{t('phone')}</p>
            <div className="phone-input-container">
              <PhoneInput
                country={'br'}
                value={phoneValue}
                onChange={setPhoneValue}
                placeholder={t('phoneNumberPlaceholder')}
                inputClass="!w-full !bg-white/10 !border !border-white/20 !text-white !rounded"
                buttonClass="!bg-white/10 !border !border-white/20 !rounded-l"
                dropdownClass="!bg-gray-800"
                searchClass="!bg-gray-700 !text-white"
                enableSearch={true}
                searchPlaceholder="Buscar país..."
                preferredCountries={['br', 'it', 'es', 'pt']}
                inputStyle={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '14px',
                  paddingLeft: '48px'
                }}
                buttonStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRight: 'none'
                }}
                dropdownStyle={{
                  backgroundColor: '#1f2937',
                  color: 'white'
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">{t('phoneInstructions')}</p>
          </div>
        </div>

        {/* Data de Nascimento */}
        <div className="flex items-start gap-3 text-white">
          <Calendar size={20} className="text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{t('birthDate')}</p>
            <div className="datepicker-container">
              <DatePicker
                selected={birthDate}
                onChange={(date) => setBirthDate(date)}
                dateFormat="dd/MM/yyyy"
                locale={dateLocale}
                placeholderText={t('birthDatePlaceholder')}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                yearDropdownItemNumber={100}
                scrollableYearDropdown
                className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                wrapperClassName="w-full"
                popperClassName="react-datepicker-dark"
                calendarClassName="react-datepicker-dark"
                isClearable
                showPopperArrow={false}
              />
            </div>
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-400">{errors.birthDate.message}</p>
            )}
          </div>
        </div>

        {/* Seção Profissional */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4">
            {t('professionalProfile')}
          </h3>

          {/* Profissão */}
          <div className="flex items-start gap-3 text-white mb-4">
            <Briefcase size={20} className="text-secondary mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{t('profession')}</p>
              <input
                {...register('profession')}
                type="text"
                placeholder={t('professionPlaceholder')}
                className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
              {errors.profession && (
                <p className="mt-1 text-sm text-red-400">{errors.profession.message}</p>
              )}
            </div>
          </div>

          {/* Especialização */}
          <div className="flex items-start gap-3 text-white mb-4">
            <BookOpen size={20} className="text-secondary mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{t('specialization')}</p>
              <input
                {...register('specialization')}
                type="text"
                placeholder={t('specializationPlaceholder')}
                className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
              {errors.specialization && (
                <p className="mt-1 text-sm text-red-400">{errors.specialization.message}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="flex items-start gap-3 text-white">
            <FileText size={20} className="text-secondary mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{t('bio')}</p>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder={t('bioPlaceholder')}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Consentimento da Comunidade */}
        <div className="pt-4 border-t border-white/10">
          <div className={`rounded-lg border-2 transition-all duration-300 ${
            communityConsent 
              ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20' 
              : 'bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-500/50'
          }`}>
            <label className="flex items-start gap-4 p-4 cursor-pointer">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  checked={communityConsent}
                  onChange={(e) => setCommunityConsent(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-md transition-all duration-300 ${
                  communityConsent 
                    ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                    : 'bg-white/10 border-2 border-white/30 hover:border-secondary/50'
                }`}>
                  {communityConsent && (
                    <Check size={16} className="text-white m-1 animate-in zoom-in-50 duration-200" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className={communityConsent ? 'text-green-400' : 'text-yellow-400'} />
                  <p className={`font-semibold text-lg ${
                    communityConsent ? 'text-green-400' : 'text-yellow-300'
                  }`}>
                    {t('communityConsent')}
                  </p>
                  {communityConsent ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium animate-in fade-in-0 zoom-in-95 duration-200">
                      {t('activated')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                      {t('deactivated')}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                  {t('communityConsentDescription')}
                </p>
                
                {communityConsent ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm animate-in slide-in-from-top-1 duration-300">
                    <CheckCircle size={16} />
                    <span>{t('communityConsentActive')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle size={16} />
                    <span className="font-medium">{t('communityConsentInactive')}</span>
                  </div>
                )}
              </div>
            </label>
          </div>
          
          {/* Benefícios de ativar */}
          {!communityConsent && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-in fade-in-50 duration-300">
              <p className="text-blue-300 text-sm font-medium mb-2">
                {t('communityBenefitsTitle')}
              </p>
              <ul className="space-y-1 text-blue-200 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('communityBenefit1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('communityBenefit2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('communityBenefit3')}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Upload de Currículo */}
        <div className="pt-4 border-t border-white/10">
          <div className="space-y-3">
            <label className="text-sm text-white/80 flex items-center gap-2">
              <FileText size={18} className="text-secondary" />
              {t('curriculum') || 'Curriculum Vitae'}
            </label>
            
            <div className="flex flex-col gap-3">
              {curriculumUrl ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-green-400" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">
                        {curriculumFileName || t('curriculumUploaded') || 'Curriculum uploaded'}
                      </p>
                      <p className="text-xs text-green-400/60">
                        {t('clickToDownload') || 'Click to download'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCurriculum}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    id="curriculumUpload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCurriculumUpload(file);
                      }
                    }}
                    disabled={uploadingCurriculum}
                  />
                  <label
                    htmlFor="curriculumUpload"
                    className="flex items-center justify-center gap-3 p-4 bg-white/5 border-2 border-dashed border-white/20 rounded-lg hover:border-secondary/50 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    {uploadingCurriculum ? (
                      <>
                        <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-white/60">
                          {t('uploadingCurriculum') || 'Uploading...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-secondary" />
                        <span className="text-sm text-white/60">
                          {t('uploadCurriculum') || 'Upload PDF or Word document (max 10MB)'}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cidadania Europeia */}
        <div className="pt-4 border-t border-white/10">
          <div className={`rounded-lg border-2 transition-all duration-300 ${
            hasEuropeanCitizenship 
              ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20' 
              : 'bg-white/5 border-white/20 hover:border-white/30'
          }`}>
            <label className="flex items-start gap-4 p-4 cursor-pointer">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  checked={hasEuropeanCitizenship}
                  onChange={(e) => setHasEuropeanCitizenship(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-md transition-all duration-300 ${
                  hasEuropeanCitizenship 
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/50' 
                    : 'bg-white/10 border-2 border-white/30 hover:border-secondary/50'
                }`}>
                  {hasEuropeanCitizenship && (
                    <Check size={16} className="text-white m-1 animate-in zoom-in-50 duration-200" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={20} className={hasEuropeanCitizenship ? 'text-blue-400' : 'text-white/60'} />
                  <p className={`font-semibold text-lg ${
                    hasEuropeanCitizenship ? 'text-blue-400' : 'text-white/80'
                  }`}>
                    {t('europeanCitizenship') || 'European Citizenship'}
                  </p>
                  {hasEuropeanCitizenship && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium animate-in fade-in-0 zoom-in-95 duration-200">
                      {t('yes') || 'Yes'}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed">
                  {t('europeanCitizenshipDescription') || 'Do you have citizenship from any European Union country?'}
                </p>
                
                {hasEuropeanCitizenship && (
                  <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-md animate-in slide-in-from-top-1 duration-300">
                    <p className="text-xs text-blue-300">
                      {t('europeanCitizenshipInfo') || 'This information may provide additional opportunities and benefits within the European medical system.'}
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Check size={16} />
          )}
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50"
        >
          <X size={16} />
          {t('cancel')}
        </button>
      </div>

      <style jsx global>{`
        .phone-input-container .react-tel-input {
          width: 100%;
        }
        
        .phone-input-container .react-tel-input .flag-dropdown {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        .phone-input-container .react-tel-input .selected-flag:hover,
        .phone-input-container .react-tel-input .selected-flag:focus {
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
        
        .phone-input-container .react-tel-input .country-list {
          background-color: #1f2937 !important;
          color: white !important;
        }
        
        .phone-input-container .react-tel-input .country-list .country:hover {
          background-color: #374151 !important;
        }
        
        .phone-input-container .react-tel-input .country-list .country.highlight {
          background-color: #4b5563 !important;
        }
        
        .phone-input-container .react-tel-input input::placeholder {
          color: #9ca3af;
        }
        
        .phone-input-container .react-tel-input .search-box {
          background-color: #374151 !important;
          color: white !important;
          border-color: #4b5563 !important;
        }
        
        .phone-input-container .react-tel-input .search-box::placeholder {
          color: #9ca3af;
        }
        
        /* DatePicker Dark Theme */
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .react-datepicker__input-container input {
          width: 100%;
        }
        
        .react-datepicker-dark.react-datepicker {
          background-color: #1f2937;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-family: inherit;
        }
        
        .react-datepicker-dark .react-datepicker__header {
          background-color: #111827;
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }
        
        .react-datepicker-dark .react-datepicker__current-month,
        .react-datepicker-dark .react-datepicker__day-name,
        .react-datepicker-dark .react-datepicker__day {
          color: white;
        }
        
        .react-datepicker-dark .react-datepicker__day:hover {
          background-color: #3887A6;
          color: white;
        }
        
        .react-datepicker-dark .react-datepicker__day--selected {
          background-color: #0C3559;
          color: white;
        }
        
        .react-datepicker-dark .react-datepicker__day--selected:hover {
          background-color: #0C3559;
        }
        
        .react-datepicker-dark .react-datepicker__day--keyboard-selected {
          background-color: #3887A6;
        }
        
        .react-datepicker-dark .react-datepicker__day--disabled {
          color: #6b7280;
        }
        
        .react-datepicker-dark .react-datepicker__day--outside-month {
          color: #4b5563;
        }
        
        .react-datepicker-dark .react-datepicker__month-dropdown,
        .react-datepicker-dark .react-datepicker__year-dropdown {
          background-color: #1f2937;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .react-datepicker-dark .react-datepicker__month-option:hover,
        .react-datepicker-dark .react-datepicker__year-option:hover {
          background-color: #3887A6;
        }
        
        .react-datepicker-dark .react-datepicker__month-option--selected,
        .react-datepicker-dark .react-datepicker__year-option--selected {
          background-color: #0C3559;
        }
        
        .react-datepicker-dark .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        
        .react-datepicker-dark .react-datepicker__navigation:hover *::before {
          border-color: #3887A6;
        }
        
        .react-datepicker-dark .react-datepicker__today-button {
          background: #3887A6;
          color: white;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle::before,
        .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle::before {
          border-bottom-color: rgba(255, 255, 255, 0.2);
        }
        
        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle::after,
        .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle::after {
          border-bottom-color: #1f2937;
        }
      `}</style>
    </form>
  );
}