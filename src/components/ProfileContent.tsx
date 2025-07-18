// /src/components/ProfileContent.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AddAddressModal from '@/components/AddAddressModal';
import StudentAssessmentStatus from '@/components/StudentAssessmentStatus';
import {
  MapPin,
  Plus,
  Calendar,
  Phone,
  Mail,
  Hash,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import Image from 'next/image';

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  birthDate?: string;
  lastLogin?: string;
  profileImageUrl?: string;
  role: string;
}

interface ProfileContentProps {
  userData: UserData;
  initialAddresses: Address[];
  locale: string;
}

export default function ProfileContent({
  userData,
  initialAddresses,
  locale,
}: ProfileContentProps) {
  const t = useTranslations('Profile');
  const [addresses, setAddresses] = useState<Address[]>(
    initialAddresses
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] =
    useState(false);
  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);
  const [modalMode, setModalMode] = useState<
    'add' | 'edit'
  >('add');
  const [deletingAddressId, setDeletingAddressId] =
    useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteToast, setShowDeleteToast] =
    useState(false);
  const [pendingDeleteAddress, setPendingDeleteAddress] =
    useState<Address | null>(null);

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(
      locale === 'pt'
        ? 'pt-BR'
        : locale === 'es'
        ? 'es-ES'
        : 'it-IT'
    );
  };

  const handleAddressAdded = async () => {
    setIsLoadingAddresses(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';

      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${apiUrl}/addresses?userId=${userData.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const updatedAddresses = await response.json();
        setAddresses(updatedAddresses);
      }
    } catch (error) {
      console.error(
        'Error fetching updated addresses:',
        error
      );
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    setModalMode('edit');
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setModalMode('add');
  };

  const showDeleteConfirmation = (address: Address) => {
    setPendingDeleteAddress(address);
    setShowDeleteToast(true);
  };

  const hideDeleteConfirmation = () => {
    setShowDeleteToast(false);
    setPendingDeleteAddress(null);
  };

  const confirmDeleteAddress = async () => {
    if (!pendingDeleteAddress) return;

    setIsDeleting(true);
    setDeletingAddressId(pendingDeleteAddress.id);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';

      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${apiUrl}/addresses/${pendingDeleteAddress.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`
        );
      }

      // Remove address from local state
      setAddresses(prev =>
        prev.filter(
          addr => addr.id !== pendingDeleteAddress.id
        )
      );

      // Hide confirmation toast
      hideDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting address:', error);
      // You might want to show an error toast here
    } finally {
      setIsDeleting(false);
      setDeletingAddressId(null);
    }
  };

  return (
    <>
      <div className="px-6 pb-8 space-y-8">
        {/* Avaliações Abertas */}
        <StudentAssessmentStatus userId={userData.id} locale={locale} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {t('personalInfo')}
                </h2>
              </div>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Image
                  src={
                    userData.profileImageUrl ||
                    '/icons/avatar.svg'
                  }
                  alt={userData.name}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-secondary object-cover"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <Image
                  src="/icons/avatar.svg"
                  alt="Name"
                  width={20}
                  height={20}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('name')}
                  </p>
                  <p className="font-medium">
                    {userData.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white">
                <Mail
                  size={20}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('email')}
                  </p>
                  <p className="font-medium">
                    {userData.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-white">
                <Hash
                  size={20}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('cpf')}
                  </p>
                  <p className="font-medium">
                    {userData.cpf}
                  </p>
                </div>
              </div>

              {userData.phone && (
                <div className="flex items-center gap-3 text-white">
                  <Phone
                    size={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('phone')}
                    </p>
                    <p className="font-medium">
                      {userData.phone}
                    </p>
                  </div>
                </div>
              )}

              {userData.birthDate && (
                <div className="flex items-center gap-3 text-white">
                  <Calendar
                    size={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('birthDate')}
                    </p>
                    <p className="font-medium">
                      {formatDate(userData.birthDate)}
                    </p>
                  </div>
                </div>
              )}

              {userData.lastLogin && (
                <div className="flex items-center gap-3 text-white">
                  <Calendar
                    size={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('lastLogin')}
                    </p>
                    <p className="font-medium">
                      {formatDate(userData.lastLogin)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Endereços */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin
                  size={24}
                  className="text-secondary"
                />
                {t('addresses')}
              </h2>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary"
              >
                <Plus size={20} />
                {t('addAddress')}
              </button>
            </div>

            {isLoadingAddresses ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
                <p className="text-gray-400">
                  {t('loadingAddresses')}
                </p>
              </div>
            ) : addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-secondary transition-colors relative group"
                  >
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          openEditModal(address)
                        }
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        title={t('editAddress')}
                        disabled={
                          isDeleting &&
                          deletingAddressId === address.id
                        }
                      >
                        <Edit
                          size={16}
                          className="text-white"
                        />
                      </button>
                      <button
                        onClick={() =>
                          showDeleteConfirmation(address)
                        }
                        className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                        title={t('deleteAddress')}
                        disabled={
                          isDeleting &&
                          deletingAddressId === address.id
                        }
                      >
                        {isDeleting &&
                        deletingAddressId === address.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <Trash2
                            size={16}
                            className="text-red-400"
                          />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 text-white pr-20">
                      <p className="font-medium">
                        {address.street}, {address.number}
                      </p>
                      {address.complement && (
                        <p className="text-sm text-gray-400">
                          {address.complement}
                        </p>
                      )}
                      {address.district && (
                        <p className="text-sm text-gray-400">
                          {address.district}
                        </p>
                      )}
                      <p className="text-sm">
                        {address.city}
                        {address.state &&
                          `, ${address.state}`}{' '}
                        - {address.country}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t('postalCode')}:{' '}
                        {address.postalCode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin
                  size={48}
                  className="mx-auto mb-4 text-gray-500"
                />
                <p className="text-gray-400 mb-4">
                  {t('noAddresses')}
                </p>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  <Plus size={20} />
                  {t('addFirstAddress')}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Toast */}
      {showDeleteToast && pendingDeleteAddress && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {t('confirmDeleteAddress')}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('deleteAddressWarning', {
                  street: pendingDeleteAddress.street,
                  number: pendingDeleteAddress.number,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmDeleteAddress}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                  ) : (
                    <Check size={14} />
                  )}
                  {isDeleting
                    ? t('deleting')
                    : t('confirmDelete')}
                </button>
                <button
                  onClick={hideDeleteConfirmation}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <X size={14} />
                  {t('cancel')}
                </button>
              </div>
            </div>
            <button
              onClick={hideDeleteConfirmation}
              disabled={isDeleting}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddAddressModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddressAdded={handleAddressAdded}
        userId={userData.id}
        editAddress={editingAddress}
        mode={modalMode}
      />
    </>
  );
}
