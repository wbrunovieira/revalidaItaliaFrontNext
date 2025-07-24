// /src/components/EditProfileForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import Image from 'next/image';

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  birthDate?: string;
  profileImageUrl?: string;
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

  // Schema de validação com Zod (removendo validação de email e CPF pois não são editáveis)
  const profileSchema = z.object({
    name: z.string().min(3, { message: t('validation.nameMin') }),
    birthDate: z.string().optional(),
    profileImageUrl: z.union([
      z.literal(''),
      z.string().url({ message: t('validation.urlInvalid') }),
      z.string().regex(/^\//, { message: t('validation.urlInvalid') })
    ]).optional(),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  interface UpdateData {
    name?: string;
    phone?: string;
    birthDate?: string;
    profileImageUrl?: string;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData.name,
      birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : '',
      profileImageUrl: userData.profileImageUrl || '',
    },
  });

  const watchedProfileImageUrl = watch('profileImageUrl');

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
      if (data.profileImageUrl !== (userData.profileImageUrl || '')) {
        updateData.profileImageUrl = data.profileImageUrl;
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
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Image
            src={
              watchedProfileImageUrl ||
              userData.profileImageUrl ||
              '/icons/avatar.svg'
            }
            alt={userData.name}
            width={120}
            height={120}
            className="rounded-full border-4 border-secondary object-cover"
          />
          <button
            type="button"
            className="absolute bottom-0 right-0 p-2 bg-secondary rounded-full hover:bg-secondary/90 transition-colors"
            title={t('changePhoto')}
          >
            <Camera size={20} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Campo de URL da imagem */}
      <div>
        <input
          {...register('profileImageUrl')}
          type="text"
          placeholder={t('profileImageUrl')}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
        {errors.profileImageUrl && (
          <p className="mt-1 text-sm text-red-400">{errors.profileImageUrl.message}</p>
        )}
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
              {userData.cpf}
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