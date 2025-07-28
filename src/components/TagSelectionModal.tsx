// /src/components/TagSelectionModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Search,
  Tag,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface FlashcardTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface TagSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: FlashcardTag[];
  onTagsSelected: (tags: FlashcardTag[]) => void;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TagSelectionModal({
  isOpen,
  onClose,
  selectedTags,
  onTagsSelected,
}: TagSelectionModalProps) {
  const t = useTranslations('Admin.tagSelection');
  const { toast } = useToast();
  
  const [tags, setTags] = useState<FlashcardTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  // Track selected tags locally
  const [localSelectedTags, setLocalSelectedTags] = useState<Map<string, FlashcardTag>>(
    new Map(selectedTags.map(tag => [tag.id, tag]))
  );

  // Load tags
  const loadTags = useCallback(async (page: number = 1, searchTerm: string = '') => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '20');
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      queryParams.append('sortBy', 'name');
      queryParams.append('sortOrder', 'asc');

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags?${queryParams}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load tags: ${response.status}`);
      }

      const data = await response.json();
      
      // API returns flashcardTags array directly
      setTags(data.flashcardTags || []);
      
      // Since API doesn't return pagination meta, calculate it
      const totalItems = data.flashcardTags?.length || 0;
      setPagination({
        total: totalItems,
        page: page,
        limit: 20,
        totalPages: Math.ceil(totalItems / 20) || 1,
      });
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: t('errors.loadTitle'),
        description: t('errors.loadDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Load initial tags when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTags(1, '');
    }
  }, [isOpen, loadTags]);

  // Debounce search
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      loadTags(1, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isOpen, loadTags]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: FlashcardTag) => {
    setLocalSelectedTags(prev => {
      const newMap = new Map(prev);
      if (newMap.has(tag.id)) {
        newMap.delete(tag.id);
      } else {
        newMap.set(tag.id, tag);
      }
      return newMap;
    });
  }, []);

  // Check if tag is selected
  const isTagSelected = useCallback((tagId: string): boolean => {
    return localSelectedTags.has(tagId);
  }, [localSelectedTags]);

  // Handle confirm
  const handleConfirm = () => {
    const selectedTagsArray = Array.from(localSelectedTags.values());
    onTagsSelected(selectedTagsArray);
    onClose();
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadTags(newPage, search);
    }
  };

  // Calculate tag count
  const selectedCount = localSelectedTags.size;

  // Handle escape key
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Tag size={28} className="text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('title')}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedCount > 0 
                  ? t('selectedCount', { count: selectedCount })
                  : t('selectTags')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 size={24} className="animate-spin text-purple-400" />
                <span className="text-gray-400">{t('loading')}</span>
              </div>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <Tag size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">{t('noTags')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tags.map((tag) => {
                const isSelected = isTagSelected(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-500'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium">
                      {tag.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-gray-400 text-sm">
              {t('pageOf', { current: pagination.page, total: pagination.totalPages })}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Check size={16} />
            {t('confirm', { count: selectedCount })}
          </button>
        </div>
      </div>
    </div>
  );
}