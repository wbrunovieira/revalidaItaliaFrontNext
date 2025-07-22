// /src/components/CreateUserForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  CreditCard,
  Shield,
  Check,
  X,
} from 'lucide-react';
import Image from 'next/image';

type UserRole = 'admin' | 'tutor' | 'student';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  nationalId: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  nationalId?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  nationalId: string;
}

interface PasswordStrength {
  score: number;
  hasLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function CreateUserForm() {
  const t = useTranslations('Admin.createUser');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    nationalId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  // Verificação em tempo real se as senhas coincidem
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;


  // Análise de força da senha
  const analyzePasswordStrength = useCallback(
    (password: string): PasswordStrength => {
      const hasLength = password.length >= 8;
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial =
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
          password
        );

      const score = [
        hasLength,
        hasLower,
        hasUpper,
        hasNumber,
        hasSpecial,
      ].filter(Boolean).length;

      return {
        score,
        hasLength,
        hasLower,
        hasUpper,
        hasNumber,
        hasSpecial,
      };
    },
    []
  );

  // Validação individual de campos
  const validateField = useCallback(
    (
      field: keyof FormData,
      value: string
    ): ValidationResult => {
      switch (field) {
        case 'name':
          if (!value.trim()) {
            return {
              isValid: false,
              message: t('errors.nameRequired'),
            };
          }
          if (value.trim().length < 2) {
            return {
              isValid: false,
              message: t('errors.nameMin'),
            };
          }
          if (value.trim().length > 100) {
            return {
              isValid: false,
              message: t('errors.nameMax'),
            };
          }
          if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
            return {
              isValid: false,
              message: t('errors.nameInvalid'),
            };
          }
          return { isValid: true };

        case 'email':
          if (!value.trim()) {
            return {
              isValid: false,
              message: t('errors.emailRequired'),
            };
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return {
              isValid: false,
              message: t('errors.emailInvalid'),
            };
          }
          if (value.length > 254) {
            return {
              isValid: false,
              message: t('errors.emailMax'),
            };
          }
          return { isValid: true };

        case 'password':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.passwordRequired'),
            };
          }
          const strength = analyzePasswordStrength(value);
          if (!strength.hasLength) {
            return {
              isValid: false,
              message: t('errors.passwordMin'),
            };
          }
          if (strength.score < 3) {
            return {
              isValid: false,
              message: t('errors.passwordWeak'),
            };
          }
          return { isValid: true };

        case 'confirmPassword':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.confirmPasswordRequired'),
            };
          }
          if (value !== formData.password) {
            return {
              isValid: false,
              message: t('errors.passwordMismatch'),
            };
          }
          return { isValid: true };

        case 'nationalId':
          const trimmed = value.trim();
          
          // Validação 1: Campo obrigatório
          if (!trimmed) {
            return {
              isValid: false,
              message: t('errors.cpfRequired'),
            };
          }
          
          // Validação 2: Mínimo 5 caracteres
          if (trimmed.length < 5) {
            return {
              isValid: false,
              message: t('errors.documentMin'),
            };
          }
          
          // Validação 3: Máximo 20 caracteres
          if (trimmed.length > 20) {
            return {
              isValid: false,
              message: t('errors.documentMax'),
            };
          }
          
          // Validação 4: Apenas letras, números e hífens
          if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
            return {
              isValid: false,
              message: t('errors.documentInvalid'),
            };
          }
          
          return { isValid: true };

        case 'role':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.roleRequired'),
            };
          }
          if (
            !['admin', 'tutor', 'student'].includes(value)
          ) {
            return {
              isValid: false,
              message: t('errors.roleInvalid'),
            };
          }
          return { isValid: true };

        default:
          return { isValid: true };
      }
    },
    [
      formData.password,
      t,
      analyzePasswordStrength,
    ]
  );

  // Validação do formulário completo
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (
      Object.keys(formData) as Array<keyof FormData>
    ).forEach(field => {
      const validation = validateField(
        field,
        formData[field]
      );
      if (!validation.isValid) {
        newErrors[field] = validation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: keyof FormData, value: string) => {
      if (touched[field]) {
        const validation = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [field]: validation.isValid
            ? undefined
            : validation.message,
        }));
      }
    },
    [touched, validateField]
  );

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);

        // Tratamento de erros específicos da API
        if (
          error.message.includes('409') ||
          error.message.includes('conflict') ||
          error.message.includes('already exists') ||
          error.message.includes('User already exists')
        ) {
          toast({
            title: t('error.conflictTitle'),
            description: t('error.conflictDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('400') ||
          error.message.includes('Bad Request')
        ) {
          toast({
            title: t('error.validationTitle'),
            description: t('error.validationDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
        ) {
          toast({
            title: t('error.authTitle'),
            description: t('error.authDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('403') ||
          error.message.includes('Forbidden')
        ) {
          toast({
            title: t('error.permissionTitle'),
            description: t('error.permissionDescription'),
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    },
    [toast, t]
  );

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<void> => {
      // Obter token de múltiplas fontes
      const token =
        document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1] ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create user: ${response.status} - ${errorText}`
        );
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      nationalId: '',
    });
    setErrors({});
    setTouched({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allTouched = Object.keys(formData).reduce(
      (acc, field) => {
        acc[field as keyof FormData] = true;
        return acc;
      },
      {} as Record<keyof FormData, boolean>
    );
    setTouched(allTouched);

    if (!validateForm()) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload: CreateUserPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        nationalId: formData.nationalId.trim(),
      };

      await createUser(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'User creation error');
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = useCallback(
    (field: keyof FormData) => (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      handleFieldValidation(field, value);
    },
    [handleFieldValidation]
  );

  const handleInputBlur = useCallback(
    (field: keyof FormData) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      handleFieldValidation(field, formData[field]);
    },
    [formData, handleFieldValidation]
  );

  const handleNationalIdChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, nationalId: value }));
      handleFieldValidation('nationalId', value);
    },
    [handleFieldValidation]
  );

  // Validação em tempo real das senhas
  useEffect(() => {
    if (
      touched.confirmPassword &&
      formData.confirmPassword
    ) {
      handleFieldValidation(
        'confirmPassword',
        formData.confirmPassword
      );
    }
  }, [
    formData.password,
    formData.confirmPassword,
    touched.confirmPassword,
    handleFieldValidation,
  ]);

  const passwordStrength = analyzePasswordStrength(
    formData.password
  );

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-400';
    if (score <= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return t('passwordStrength.weak');
    if (score <= 3) return t('passwordStrength.medium');
    return t('passwordStrength.strong');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <UserPlus size={24} className="text-secondary" />
          {t('title')}
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-gray-300 flex items-center gap-2"
            >
              <User size={16} />
              {t('fields.name')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="name"
              placeholder={t('placeholders.name')}
              value={formData.name}
              onChange={e =>
                handleInputChange('name')(e.target.value)
              }
              onBlur={handleInputBlur('name')}
              error={errors.name}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.name && !errors.name && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.nameValid')}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-300 flex items-center gap-2"
            >
              <Mail size={16} />
              {t('fields.email')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="email"
              type="email"
              placeholder={t('placeholders.email')}
              value={formData.email}
              onChange={e =>
                handleInputChange('email')(e.target.value)
              }
              onBlur={handleInputBlur('email')}
              error={errors.email}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.email && !errors.email && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.emailValid')}
              </div>
            )}
          </div>

          {/* Documento */}
          <div className="space-y-2">
            <Label
              htmlFor="nationalId"
              className="text-gray-300 flex items-center gap-2"
            >
              <CreditCard size={16} />
              {t('fields.document')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="nationalId"
              placeholder={t('placeholders.document')}
              value={formData.nationalId}
              onChange={e =>
                handleNationalIdChange(e.target.value)
              }
              onBlur={handleInputBlur('nationalId')}
              error={errors.nationalId}
              maxLength={20}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t('helpers.documentTypes')}
            </p>
            {formData.nationalId && !errors.nationalId && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.documentValid')}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-gray-300 flex items-center gap-2"
            >
              <Shield size={16} />
              {t('fields.role')}
              <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => {
                setFormData(prev => ({
                  ...prev,
                  role: value,
                }));
                setTouched(prev => ({
                  ...prev,
                  role: true,
                }));
              }}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue
                  placeholder={t('placeholders.role')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem
                  value="student"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.student')}
                </SelectItem>
                <SelectItem
                  value="tutor"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.tutor')}
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.admin')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-300 flex items-center gap-2"
            >
              <Lock size={16} />
              {t('fields.password')}
              <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <TextField
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('placeholders.password')}
                value={formData.password}
                onChange={e =>
                  handleInputChange('password')(
                    e.target.value
                  )
                }
                onBlur={handleInputBlur('password')}
                error={errors.password}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 transform pr-3"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Image
                  src={
                    showPassword
                      ? '/icons/visionOpen.svg'
                      : '/icons/VIsionClosed.svg'
                  }
                  alt={showPassword ? 'Hide' : 'Show'}
                  width={18}
                  height={18}
                />
              </button>
            </div>

            {/* Indicador de força da senha */}
            {formData.password && (
              <div className="space-y-2">
                <div
                  className={`text-sm ${getPasswordStrengthColor(
                    passwordStrength.score
                  )}`}
                >
                  {t('passwordStrength.label')}:{' '}
                  {getPasswordStrengthText(
                    passwordStrength.score
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasLength
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasLength ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.length')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasLower
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasLower ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.lowercase')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasUpper
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasUpper ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.uppercase')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasNumber
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasNumber ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.number')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasSpecial
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasSpecial ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.special')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-gray-300 flex items-center gap-2"
            >
              <Lock size={16} />
              {t('fields.confirmPassword')}
              <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <TextField
                id="confirmPassword"
                type={
                  showConfirmPassword ? 'text' : 'password'
                }
                placeholder={t(
                  'placeholders.confirmPassword'
                )}
                value={formData.confirmPassword}
                onChange={e =>
                  handleInputChange('confirmPassword')(
                    e.target.value
                  )
                }
                onBlur={handleInputBlur('confirmPassword')}
                error={formData.password && formData.confirmPassword ? undefined : errors.confirmPassword}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 transform pr-3"
                aria-label={
                  showConfirmPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Image
                  src={
                    showConfirmPassword
                      ? '/icons/visionOpen.svg'
                      : '/icons/VIsionClosed.svg'
                  }
                  alt={
                    showConfirmPassword ? 'Hide' : 'Show'
                  }
                  width={18}
                  height={18}
                />
              </button>
            </div>

            {/* Indicador de correspondência das senhas */}
            {formData.password &&
              formData.confirmPassword && (
                <div
                  className={`text-sm flex items-center gap-2 ${
                    passwordsMatch
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {passwordsMatch ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}
                  {passwordsMatch
                    ? t('passwordMatch')
                    : t('errors.passwordMismatch')}
                </div>
              )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-secondary text-primary hover:bg-secondary/90 px-6 py-3"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
