// /src/components/FlashcardTagsList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Tag,
  Loader2,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import FlashcardTagEditModal from './FlashcardTagEditModal';

interface FlashcardTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export default function FlashcardTagsList() {
  const t = useTranslations('Admin.flashcardTagsList');
  const { toast } = useToast();

  const [tags, setTags] = useState<FlashcardTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<FlashcardTag | null>(null);

  // Load tags
  const loadTags = useCallback(async () => {
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('sortBy', 'name');
      queryParams.append('sortOrder', 'asc');
      
      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags?${queryParams}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load tags');
      }

      const data = await response.json();
      setTags(data.flashcardTags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, t, toast]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Load tags on mount and when search changes
  useEffect(() => {
    loadTags();
  }, [debouncedSearch]);

  // Handle edit tag
  const handleEdit = useCallback((tag: FlashcardTag) => {
    setSelectedTag(tag);
    setEditModalOpen(true);
  }, []);

  // Handle close edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setSelectedTag(null);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    loadTags();
  }, [loadTags]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Tag size={24} className="text-secondary" />
        <div>
          <h3 className="text-xl font-bold text-white">
            {t('title')}
          </h3>
          <p className="text-sm text-gray-400">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
        />
      </div>

      {/* Tags List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2
              size={20}
              className="animate-spin text-secondary"
            />
            <span className="text-gray-400 text-sm">
              {t('loading')}
            </span>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 bg-gray-800/30 rounded-lg">
          <Tag size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-400">{t('noTags')}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-secondary/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Tag size={14} className="text-purple-400 flex-shrink-0" />
                <span className="text-white text-sm truncate">
                  {tag.name}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title={t('actions.edit')}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete
                    console.log('Delete tag:', tag.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title={t('actions.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && tags.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {t('totalTags', { count: tags.length })}
        </p>
      )}

      {/* Edit Modal */}
      <FlashcardTagEditModal
        tag={selectedTag}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />
    </div>
  );
}