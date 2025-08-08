// /src/components/AddAddressModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, Save, Loader2 } from 'lucide-react';

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  district?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode: string;
  label?: string | null;
  isPrimary?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded: () => void;
  userId: string;
  editAddress?: Address | null;
  mode?: 'add' | 'edit';
}

interface AddressFormData {
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export default function AddAddressModal({
  isOpen,
  onClose,
  onAddressAdded,
  userId,
  editAddress = null,
  mode = 'add',
}: AddAddressModalProps) {
  const t = useTranslations('Profile');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(
    {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    }
  );

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && editAddress) {
      setFormData({
        street: editAddress.street || '',
        number: editAddress.number || '',
        complement: editAddress.complement || '',
        district: editAddress.district || '',
        city: editAddress.city || '',
        state: editAddress.state || '',
        country: editAddress.country || '',
        postalCode: editAddress.postalCode || '',
      });
    } else if (mode === 'add') {
      setFormData({
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });
    }
  }, [mode, editAddress, isOpen]);

  const [errors, setErrors] = useState<
    Partial<AddressFormData>
  >({});

  const handleInputChange = (
    field: keyof AddressFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.street.trim()) {
      newErrors.street = t('streetRequired');
    }
    if (!formData.number.trim()) {
      newErrors.number = t('numberRequired');
    }
    if (!formData.city.trim()) {
      newErrors.city = t('cityRequired');
    }
    if (!formData.country.trim()) {
      newErrors.country = t('countryRequired');
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t('postalCodeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';

      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const url =
        mode === 'edit' && editAddress
          ? `${apiUrl}/api/v1/addresses/${editAddress.id}`
          : `${apiUrl}/api/v1/addresses`;

      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const body =
        mode === 'edit'
          ? formData // For PATCH, don't include userId
          : { userId, ...formData }; // For POST, include userId

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`
        );
      }

      // Reset form
      setFormData({
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });

      onAddressAdded();
      onClose();
    } catch (error) {
      console.error(
        `Error ${
          mode === 'edit' ? 'updating' : 'creating'
        } address:`,
        error
      );
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-primary text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <MapPin size={24} className="text-secondary" />
            <h2 className="text-xl font-bold">
              {mode === 'edit'
                ? t('editAddress')
                : t('addAddress')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >
          {/* Street */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('street')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={e =>
                handleInputChange('street', e.target.value)
              }
              className={`w-full text-primary px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.street
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('streetPlaceholder')}
              disabled={isLoading}
            />
            {errors.street && (
              <p className="mt-1 text-sm text-red-500">
                {errors.street}
              </p>
            )}
          </div>

          {/* Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('number')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={e =>
                handleInputChange('number', e.target.value)
              }
              className={`w-full text-primary px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.number
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('numberPlaceholder')}
              disabled={isLoading}
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-500">
                {errors.number}
              </p>
            )}
          </div>

          {/* Complement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('complement')}
            </label>
            <input
              type="text"
              value={formData.complement}
              onChange={e =>
                handleInputChange(
                  'complement',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 text-primary border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('complementPlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('district')}
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={e =>
                handleInputChange(
                  'district',
                  e.target.value
                )
              }
              className="w-full px-3 py-2 border text-primary border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('districtPlaceholder')}
              disabled={isLoading}
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('city')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e =>
                  handleInputChange('city', e.target.value)
                }
                className={`w-full text-primary px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.city
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder={t('cityPlaceholder')}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.city}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('state')}
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={e =>
                  handleInputChange('state', e.target.value)
                }
                className="w-full text-primary px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('statePlaceholder')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Country and Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('country')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={e =>
                  handleInputChange(
                    'country',
                    e.target.value
                  )
                }
                className={`w-full text-primary px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.country
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder={t('countryPlaceholder')}
                disabled={isLoading}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.country}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('postalCode')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={e =>
                  handleInputChange(
                    'postalCode',
                    e.target.value
                  )
                }
                className={`w-full text-primary px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.postalCode
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder={t('postalCodePlaceholder')}
                disabled={isLoading}
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.postalCode}
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}
              {isLoading
                ? mode === 'edit'
                  ? t('updating')
                  : t('saving')
                : mode === 'edit'
                ? t('updateAddress')
                : t('saveAddress')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
