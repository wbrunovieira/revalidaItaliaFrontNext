// /src/components/ListEnvironments3D.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Box,
  Loader2,
  AlertCircle,
  Eye,
  X,
  Calendar,
  Globe,
  Pencil,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface Translation {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string | null;
}

interface Environment3D {
  id: string;
  slug: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  slug: string;
  translations: {
    pt: { title: string; description: string };
    it: { title: string; description: string };
    es: { title: string; description: string };
  };
}

export default function ListEnvironments3D() {
  const t = useTranslations('Admin.listEnvironments3D');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [environments, setEnvironments] = useState<Environment3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnv, setSelectedEnv] = useState<Environment3D | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    slug: '',
    translations: {
      pt: { title: '', description: '' },
      it: { title: '', description: '' },
      es: { title: '', description: '' },
    },
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<Environment3D | null>(null);

  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch environments: ${response.status}`);
      }

      const data = await response.json();
      setEnvironments(data);
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const getTranslationByLocale = useCallback(
    (translations: Translation[], targetLocale: string): Translation | undefined => {
      return translations.find(tr => tr.locale === targetLocale) || translations[0];
    },
    []
  );

  const fetchEnvironmentDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setIsModalOpen(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        throw new Error(t('error.notFound'));
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch environment: ${response.status}`);
      }

      const data = await response.json();
      setSelectedEnv(data);
    } catch (error) {
      console.error('Error fetching environment details:', error);
      toast({
        title: t('error.fetchDetailsTitle'),
        description: t('error.fetchDetailsDescription'),
        variant: 'destructive',
      });
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  }, [t, toast]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEnv(null);
  };

  const openEditModal = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setIsEditModalOpen(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch environment: ${response.status}`);
      }

      const data: Environment3D = await response.json();
      setSelectedEnv(data);

      // Populate form data
      const ptTrans = data.translations.find(tr => tr.locale === 'pt');
      const itTrans = data.translations.find(tr => tr.locale === 'it');
      const esTrans = data.translations.find(tr => tr.locale === 'es');

      setEditFormData({
        slug: data.slug,
        translations: {
          pt: { title: ptTrans?.title || '', description: ptTrans?.description || '' },
          it: { title: itTrans?.title || '', description: itTrans?.description || '' },
          es: { title: esTrans?.title || '', description: esTrans?.description || '' },
        },
      });
    } catch (error) {
      console.error('Error fetching environment for edit:', error);
      toast({
        title: t('error.fetchDetailsTitle'),
        description: t('error.fetchDetailsDescription'),
        variant: 'destructive',
      });
      setIsEditModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  }, [t, toast]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEnv(null);
    setEditFormData({
      slug: '',
      translations: {
        pt: { title: '', description: '' },
        it: { title: '', description: '' },
        es: { title: '', description: '' },
      },
    });
  };

  const handleEditSubmit = useCallback(async () => {
    if (!selectedEnv) return;

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const payload = {
        slug: editFormData.slug,
        translations: [
          { locale: 'pt' as const, title: editFormData.translations.pt.title, description: editFormData.translations.pt.description || null },
          { locale: 'it' as const, title: editFormData.translations.it.title, description: editFormData.translations.it.description || null },
          { locale: 'es' as const, title: editFormData.translations.es.title, description: editFormData.translations.es.description || null },
        ],
      };

      const response = await fetch(`${apiUrl}/api/v1/environments-3d/${selectedEnv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        throw new Error('not_found');
      }

      if (response.status === 409) {
        throw new Error('conflict');
      }

      if (!response.ok) {
        throw new Error(`Failed to update environment: ${response.status}`);
      }

      toast({
        title: t('edit.successTitle'),
        description: t('edit.successDescription'),
        variant: 'default',
      });

      closeEditModal();
      fetchEnvironments();
    } catch (error) {
      console.error('Error updating environment:', error);

      if (error instanceof Error && error.message === 'conflict') {
        toast({
          title: t('edit.errorTitle'),
          description: t('edit.conflictDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('edit.errorTitle'),
          description: t('edit.errorDescription'),
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }, [selectedEnv, editFormData, t, toast, fetchEnvironments]);

  const openDeleteModal = useCallback((env: Environment3D) => {
    setEnvToDelete(env);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEnvToDelete(null);
  };

  const handleDelete = useCallback(async () => {
    if (!envToDelete) return;

    setDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d/${envToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        throw new Error('not_found');
      }

      if (response.status === 409) {
        throw new Error('in_use');
      }

      if (!response.ok) {
        throw new Error(`Failed to delete environment: ${response.status}`);
      }

      toast({
        title: t('delete.successTitle'),
        description: t('delete.successDescription'),
        variant: 'default',
      });

      closeDeleteModal();
      fetchEnvironments();
    } catch (error) {
      console.error('Error deleting environment:', error);

      if (error instanceof Error && error.message === 'in_use') {
        toast({
          title: t('delete.errorTitle'),
          description: t('delete.inUseDescription'),
          variant: 'destructive',
        });
      } else if (error instanceof Error && error.message === 'not_found') {
        toast({
          title: t('delete.errorTitle'),
          description: t('error.notFound'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('delete.errorTitle'),
          description: t('delete.errorDescription'),
          variant: 'destructive',
        });
      }
    } finally {
      setDeleting(false);
    }
  }, [envToDelete, t, toast, fetchEnvironments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Box size={24} className="text-secondary" />
            {t('title')}
          </h3>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">{t('loading')}</span>
          </div>
        ) : environments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-gray-400 text-sm">{t('noEnvironments')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {environments.map(env => {
              const translation = getTranslationByLocale(env.translations, locale);
              return (
                <div
                  key={env.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <span className="text-white font-medium">
                    {translation?.title || 'Sem título'}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">slug:</span>
                      <span className="text-sm text-secondary font-mono bg-gray-800 px-2 py-1 rounded">
                        {env.slug}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchEnvironmentDetails(env.id)}
                      className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('view')}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => openEditModal(env.id)}
                      className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('edit.button')}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(env)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('delete.button')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Box size={20} className="text-secondary" />
                {t('modal.title')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                  <span className="ml-3 text-gray-400">{t('modal.loading')}</span>
                </div>
              ) : selectedEnv ? (
                <div className="space-y-6">
                  {/* Slug */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Slug</label>
                    <p className="text-secondary font-mono text-lg mt-1">{selectedEnv.slug}</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12} />
                        {t('modal.createdAt')}
                      </label>
                      <p className="text-gray-300 text-sm mt-1">{formatDate(selectedEnv.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12} />
                        {t('modal.updatedAt')}
                      </label>
                      <p className="text-gray-300 text-sm mt-1">{formatDate(selectedEnv.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Translations */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                      <Globe size={12} />
                      {t('modal.translations')}
                    </label>
                    <div className="space-y-3">
                      {selectedEnv.translations.map(tr => (
                        <div
                          key={tr.locale}
                          className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {tr.locale === 'pt' ? '🇧🇷' : tr.locale === 'it' ? '🇮🇹' : '🇪🇸'}
                            </span>
                            <span className="text-xs text-gray-400 uppercase font-semibold">
                              {tr.locale === 'pt' ? 'Português' : tr.locale === 'it' ? 'Italiano' : 'Español'}
                            </span>
                          </div>
                          <p className="text-white font-medium">{tr.title}</p>
                          {tr.description && (
                            <p className="text-gray-400 text-sm mt-1">{tr.description}</p>
                          )}
                          {!tr.description && (
                            <p className="text-gray-600 text-sm mt-1 italic">{t('modal.noDescription')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeEditModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Pencil size={20} className="text-secondary" />
                {t('edit.title')}
              </h3>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                  <span className="ml-3 text-gray-400">{t('modal.loading')}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editFormData.slug}
                      onChange={e => setEditFormData(prev => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary font-mono"
                      placeholder="environment-slug"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('edit.slugHint')}</p>
                  </div>

                  {/* Translations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <Globe size={16} />
                      {t('modal.translations')}
                    </label>

                    {/* PT */}
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🇧🇷</span>
                        <span className="text-sm text-gray-400 font-semibold">Português</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.titleLabel')} *</label>
                          <input
                            type="text"
                            value={editFormData.translations.pt.title}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                pt: { ...prev.translations.pt, title: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.descriptionLabel')}</label>
                          <input
                            type="text"
                            value={editFormData.translations.pt.description}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                pt: { ...prev.translations.pt, description: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* IT */}
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🇮🇹</span>
                        <span className="text-sm text-gray-400 font-semibold">Italiano</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.titleLabel')} *</label>
                          <input
                            type="text"
                            value={editFormData.translations.it.title}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                it: { ...prev.translations.it, title: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.descriptionLabel')}</label>
                          <input
                            type="text"
                            value={editFormData.translations.it.description}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                it: { ...prev.translations.it, description: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ES */}
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🇪🇸</span>
                        <span className="text-sm text-gray-400 font-semibold">Español</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.titleLabel')} *</label>
                          <input
                            type="text"
                            value={editFormData.translations.es.title}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                es: { ...prev.translations.es, title: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{t('edit.descriptionLabel')}</label>
                          <input
                            type="text"
                            value={editFormData.translations.es.description}
                            onChange={e => setEditFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                es: { ...prev.translations.es, description: e.target.value },
                              },
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={saving || !editFormData.translations.pt.title || !editFormData.translations.it.title || !editFormData.translations.es.title}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-primary font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? t('edit.saving') : t('edit.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && envToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                {t('delete.title')}
              </h3>
              <button
                onClick={closeDeleteModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">{t('delete.confirmation')}</p>
              <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-white font-medium">
                  {getTranslationByLocale(envToDelete.translations, locale)?.title}
                </p>
                <p className="text-sm text-secondary font-mono mt-1">{envToDelete.slug}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">{t('delete.warning')}</p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('delete.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? t('delete.deleting') : t('delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
