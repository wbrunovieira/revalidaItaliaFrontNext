// /src/components/FlashcardsList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import Image from 'next/image';
import {
  Search,
  Filter,
  CreditCard,
  Tag,
  Calendar,
  Clock,
  Image as ImageIcon,
  Type,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit2,
  Trash2,
  Power,
  Ban,
} from 'lucide-react';
import EditFlashcardModal from '@/components/EditFlashcardModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


interface FlashcardTag {
  id: string;
  name: string;
  slug: string;
}

interface Flashcard {
  id: string;
  slug: string;
  questionText: string | null;
  questionImageUrl: string | null;
  questionType: 'TEXT' | 'IMAGE';
  answerText: string | null;
  answerImageUrl: string | null;
  answerType: 'TEXT' | 'IMAGE';
  argumentId: string;
  importBatchId: string | null;
  exportedAt: string | null;
  tags: FlashcardTag[];
  enabled: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type EnabledStatusFilter = 'all' | 'enabled' | 'disabled';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FlashcardsResponse {
  success: boolean;
  flashcards: Flashcard[];
  pagination: PaginationInfo;
}

export default function FlashcardsList() {
  const t = useTranslations('Admin.flashcardsList');
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();

  const [flashcards, setFlashcards] = useState<Flashcard[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] =
    useState<PaginationInfo>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });

  // Filters
  const [search, setSearch] = useState('');
  const [questionType, setQuestionType] =
    useState<string>('');
  const [answerType, setAnswerType] = useState<string>('');
  const [enabledStatus, setEnabledStatus] =
    useState<EnabledStatusFilter>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] =
    useState<string>('desc');

  // Toggle state
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] =
    useState('');

  // Edit modal state
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  // Load flashcards
  const loadFlashcards = useCallback(
    async (page: number = 1) => {
      setLoading(true);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append(
          'limit',
          pagination.limit.toString()
        );

        if (debouncedSearch) {
          queryParams.append('search', debouncedSearch);
        }
        if (questionType && questionType !== 'ALL') {
          queryParams.append('questionType', questionType);
        }
        if (answerType && answerType !== 'ALL') {
          queryParams.append('answerType', answerType);
        }
        if (enabledStatus) {
          queryParams.append('enabledStatus', enabledStatus);
        }
        if (sortBy) {
          queryParams.append('sortBy', sortBy);
        }
        if (sortOrder) {
          queryParams.append('sortOrder', sortOrder);
        }

        if (!token || !isAuthenticated) {
          throw new Error('No authentication token');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards?${queryParams}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load flashcards');
        }

        const data: FlashcardsResponse =
          await response.json();
        setFlashcards(data.flashcards);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error loading flashcards:', error);
        toast({
          title: t('error.fetchTitle'),
          description: t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearch,
      questionType,
      answerType,
      enabledStatus,
      sortBy,
      sortOrder,
      pagination.limit,
      t,
      toast,
      token,
      isAuthenticated,
    ]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Load on filter change
  useEffect(() => {
    loadFlashcards(1);
  }, [
    debouncedSearch,
    questionType,
    answerType,
    enabledStatus,
    sortBy,
    sortOrder,
    loadFlashcards,
  ]);


  // Handle page change
  const handlePageChange = (newPage: number) => {
    loadFlashcards(newPage);
  };

  // Helper function to delete image
  const deleteImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes('/uploads/')) return;
    
    try {
      // Extract the path from the URL
      const pathMatch = imageUrl.match(/\/uploads\/(.+)/);
      if (!pathMatch) return;
      
      const path = pathMatch[1];
      await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (flashcardId: string) => {
      setDeletingId(flashcardId);

      try {
        // Find the flashcard to get image URLs before deletion
        const flashcardToDelete = flashcards.find(f => f.id === flashcardId);
        
        if (!token || !isAuthenticated) {
          throw new Error('No authentication token');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards/${flashcardId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          toast({
            title: t('success.deleteTitle'),
            description: t('success.deleteDescription'),
            variant: 'success',
          });
          
          // Delete associated images after successful flashcard deletion
          if (flashcardToDelete) {
            if (flashcardToDelete.questionType === 'IMAGE' && flashcardToDelete.questionImageUrl) {
              await deleteImage(flashcardToDelete.questionImageUrl);
            }
            if (flashcardToDelete.answerType === 'IMAGE' && flashcardToDelete.answerImageUrl) {
              await deleteImage(flashcardToDelete.answerImageUrl);
            }
          }
          
          // Reload flashcards
          loadFlashcards(pagination.page);
        } else {
          // Handle errors
          if (response.status === 404) {
            toast({
              title: t('error.deleteTitle'),
              description: t('error.notFound'),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('error.deleteTitle'),
              description: t('error.deleteFailed'),
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('Error deleting flashcard:', error);
        toast({
          title: t('error.deleteTitle'),
          description: t('error.connectionError'),
          variant: 'destructive',
        });
      } finally {
        setDeletingId(null);
      }
    },
    [t, toast, loadFlashcards, pagination.page, flashcards, token, isAuthenticated]
  );

  // Handle delete confirmation
  const handleDeleteConfirmation = useCallback(
    (flashcard: Flashcard) => {
      const questionPreview = flashcard.questionType === 'TEXT' 
        ? flashcard.questionText 
        : t('deleteConfirmation.imageQuestion');
      
      const answerPreview = flashcard.answerType === 'TEXT' 
        ? flashcard.answerText 
        : t('deleteConfirmation.imageAnswer');

      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p>{t('deleteConfirmation.message')}</p>
            <div className="p-3 bg-gray-700/50 rounded-lg space-y-2">
              <div className="text-xs text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="font-medium">{t('question')}:</span>
                  <span className="break-words">
                    {questionPreview ? questionPreview.substring(0, 100) : ''}
                    {questionPreview && questionPreview.length > 100 ? '...' : ''}
                  </span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <span className="font-medium">{t('answer')}:</span>
                  <span className="break-words">
                    {answerPreview ? answerPreview.substring(0, 100) : ''}
                    {answerPreview && answerPreview.length > 100 ? '...' : ''}
                  </span>
                </div>
                {flashcard.tags.length > 0 && (
                  <div className="flex items-start gap-2 mt-1">
                    <span className="font-medium">{t('tags.label')}:</span>
                    <span>{flashcard.tags.map(t => t.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-red-300 font-medium">
              ⚠️ {t('deleteConfirmation.warning')}
            </p>
          </div>
        ),
        variant: 'destructive',
        action: (
          <button
            onClick={() => deleteFlashcard(flashcard.id)}
            className="inline-flex h-8 items-center px-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={deletingId === flashcard.id}
          >
            {deletingId === flashcard.id ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                {t('deleteConfirmation.deleting')}
              </>
            ) : (
              t('deleteConfirmation.confirm')
            )}
          </button>
        ),
      });
    },
    [t, toast, deleteFlashcard, deletingId]
  );

  // Toggle flashcard enabled/disabled
  const toggleFlashcardEnabled = useCallback(
    async (flashcard: Flashcard) => {
      const newEnabled = !flashcard.enabled;

      // Add to toggling set
      setTogglingIds(prev => new Set(prev).add(flashcard.id));

      try {
        if (!token || !isAuthenticated) {
          throw new Error('No authentication token');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards/${flashcard.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ enabled: newEnabled }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to toggle flashcard');
        }

        // Update local state
        setFlashcards(prev =>
          prev.map(f =>
            f.id === flashcard.id
              ? { ...f, enabled: newEnabled, disabledAt: newEnabled ? null : new Date().toISOString() }
              : f
          )
        );

        toast({
          title: newEnabled ? t('toggle.enabledTitle') : t('toggle.disabledTitle'),
          description: newEnabled ? t('toggle.enabledDescription') : t('toggle.disabledDescription'),
        });
      } catch (error) {
        console.error('Error toggling flashcard:', error);
        toast({
          title: t('toggle.errorTitle'),
          description: t('toggle.errorDescription'),
          variant: 'destructive',
        });
      } finally {
        // Remove from toggling set
        setTogglingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(flashcard.id);
          return newSet;
        });
      }
    },
    [token, isAuthenticated, toast, t]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard
            size={28}
            className="text-secondary"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t('title')}
            </h2>
            <p className="text-gray-400">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {/* Question Type Filter */}
          <Select
            value={questionType}
            onValueChange={setQuestionType}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue
                placeholder={t('filters.questionType')}
              />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem
                value="ALL"
                className="text-gray-300"
              >
                {t('filters.all')}
              </SelectItem>
              <SelectItem
                value="TEXT"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  {t('types.text')}
                </div>
              </SelectItem>
              <SelectItem
                value="IMAGE"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} />
                  {t('types.image')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Answer Type Filter */}
          <Select
            value={answerType}
            onValueChange={setAnswerType}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue
                placeholder={t('filters.answerType')}
              />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem
                value="ALL"
                className="text-gray-300"
              >
                {t('filters.all')}
              </SelectItem>
              <SelectItem
                value="TEXT"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  {t('types.text')}
                </div>
              </SelectItem>
              <SelectItem
                value="IMAGE"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} />
                  {t('types.image')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Enabled Status Filter */}
          <Select
            value={enabledStatus}
            onValueChange={(value: EnabledStatusFilter) => setEnabledStatus(value)}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue
                placeholder={t('filters.enabledStatus')}
              />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem
                value="all"
                className="text-gray-300"
              >
                {t('filters.all')}
              </SelectItem>
              <SelectItem
                value="enabled"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <Power size={16} className="text-green-400" />
                  {t('status.enabled')}
                </div>
              </SelectItem>
              <SelectItem
                value="disabled"
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center gap-2">
                  <Ban size={16} className="text-red-400" />
                  {t('status.disabled')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={value => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue
                placeholder={t('filters.sortBy')}
              />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem
                value="createdAt-desc"
                className="text-white hover:bg-gray-600"
              >
                {t('sort.newestFirst')}
              </SelectItem>
              <SelectItem
                value="createdAt-asc"
                className="text-white hover:bg-gray-600"
              >
                {t('sort.oldestFirst')}
              </SelectItem>
              <SelectItem
                value="updatedAt-desc"
                className="text-white hover:bg-gray-600"
              >
                {t('sort.recentlyUpdated')}
              </SelectItem>
              <SelectItem
                value="questionText-asc"
                className="text-white hover:bg-gray-600"
              >
                {t('sort.alphabetical')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {(debouncedSearch ||
          (questionType && questionType !== 'ALL') ||
          (answerType && answerType !== 'ALL') ||
          enabledStatus !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <Filter size={16} />
            <span>{t('activeFilters')}:</span>
            {debouncedSearch && (
              <span className="px-2 py-1 bg-gray-700 rounded text-white">
                {t('searchingFor')}: {debouncedSearch}
              </span>
            )}
            {questionType && questionType !== 'ALL' && (
              <span className="px-2 py-1 bg-gray-700 rounded text-white">
                {t('questionType')}:{' '}
                {t(`types.${questionType.toLowerCase()}`)}
              </span>
            )}
            {answerType && answerType !== 'ALL' && (
              <span className="px-2 py-1 bg-gray-700 rounded text-white">
                {t('answerType')}:{' '}
                {t(`types.${answerType.toLowerCase()}`)}
              </span>
            )}
            {enabledStatus !== 'all' && (
              <span className={`px-2 py-1 rounded flex items-center gap-1 ${
                enabledStatus === 'enabled'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {enabledStatus === 'enabled' ? <Power size={12} /> : <Ban size={12} />}
                {t(`status.${enabledStatus}`)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2
              size={24}
              className="animate-spin text-secondary"
            />
            <span className="text-gray-400">
              {t('loading')}
            </span>
          </div>
        </div>
      ) : flashcards.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-gray-800/30 rounded-lg">
          <CreditCard
            size={48}
            className="mx-auto text-gray-600 mb-3"
          />
          <p className="text-gray-400 text-lg">
            {t('noFlashcards')}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {t('tryAdjustingFilters')}
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="text-gray-400 text-sm">
            {t('showing', {
              count: flashcards.length,
              total: pagination.total,
            })}
          </div>

          {/* Flashcards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {flashcards.map(flashcard => {
              const isDisabled = flashcard.enabled === false;
              const isToggling = togglingIds.has(flashcard.id);

              return (
              <div
                key={flashcard.id}
                className={`rounded-lg p-3 border transition-all relative ${
                  isDisabled
                    ? 'bg-gray-800/50 border-red-500/20'
                    : 'bg-gray-800 border-gray-700 hover:border-secondary/50'
                }`}
              >
                {/* Disabled Badge */}
                {isDisabled && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                    <Ban size={10} />
                    {t('status.disabled')}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {/* Toggle Enable/Disable Button */}
                  <button
                    onClick={() => toggleFlashcardEnabled(flashcard)}
                    disabled={isToggling}
                    className={`p-1.5 rounded transition-all ${
                      isToggling
                        ? 'text-gray-500 cursor-wait'
                        : isDisabled
                          ? 'text-red-400 hover:text-green-400 hover:bg-green-500/20'
                          : 'text-green-400 hover:text-red-400 hover:bg-red-500/20'
                    }`}
                    title={isDisabled ? t('toggle.enable') : t('toggle.disable')}
                  >
                    {isToggling ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Power size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingFlashcard(flashcard);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={t('actions.edit')}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteConfirmation(flashcard)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                    title={t('actions.delete')}
                    disabled={deletingId === flashcard.id}
                  >
                    {deletingId === flashcard.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* Question */}
                <div className={`mb-3 ${isDisabled ? 'opacity-60' : ''} ${isDisabled ? 'mt-6' : ''}`}>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    {flashcard.questionType === 'TEXT' ? (
                      <Type size={16} />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                    <span>{t('question')}</span>
                  </div>
                  <div className={isDisabled ? 'text-gray-400' : 'text-white'}>
                    {flashcard.questionType === 'TEXT' ? (
                      <p className="line-clamp-2">
                        {flashcard.questionText}
                      </p>
                    ) : (
                      <div className="relative h-16 bg-gray-700 rounded overflow-hidden">
                        <Image
                          src={
                            flashcard.questionImageUrl || '/placeholder.png'
                          }
                          alt="Question"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer */}
                <div className={`mb-3 ${isDisabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    {flashcard.answerType === 'TEXT' ? (
                      <Type size={16} />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                    <span>{t('answer')}</span>
                  </div>
                  <div className={isDisabled ? 'text-gray-400' : 'text-white'}>
                    {flashcard.answerType === 'TEXT' ? (
                      <p className="line-clamp-2">
                        {flashcard.answerText}
                      </p>
                    ) : (
                      <div className="relative h-16 bg-gray-700 rounded overflow-hidden">
                        <Image
                          src={
                            flashcard.answerImageUrl || '/placeholder.png'
                          }
                          alt="Answer"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {flashcard.tags.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mb-3 ${isDisabled ? 'opacity-60' : ''}`}>
                    {flashcard.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300"
                      >
                        <Tag size={10} />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(flashcard.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(flashcard.updatedAt)}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrev}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.first')}
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.page - 1)
                }
                disabled={!pagination.hasPrev}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="px-4 py-2 text-gray-300">
                {t('pagination.pageOf', {
                  current: pagination.page,
                  total: pagination.totalPages,
                })}
              </span>

              <button
                onClick={() =>
                  handlePageChange(pagination.page + 1)
                }
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.totalPages)
                }
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.last')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <EditFlashcardModal
        flashcard={editingFlashcard}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFlashcard(null);
        }}
        onSave={() => {
          setShowEditModal(false);
          setEditingFlashcard(null);
          loadFlashcards(pagination.page); // Reload current page
        }}
      />
    </div>
  );
}
