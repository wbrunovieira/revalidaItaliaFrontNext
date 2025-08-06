'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ReactionType } from './ReactionsButton';
import { useAuth } from '@/stores/auth.store';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface ReactionGroup {
  type: ReactionType;
  emoji: string;
  count: number;
  users: User[];
  hasCurrentUserReacted: boolean;
}

interface ReactionsResponse {
  reactions: ReactionGroup[];
  total: number;
}

interface ReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  initialTab?: ReactionType | 'all';
  anchorRef?: React.RefObject<HTMLElement>;
}

const reactionConfig: Record<ReactionType | 'all', { emoji: string; label: string; color: string }> = {
  all: { emoji: '💬', label: 'all', color: 'text-gray-400' },
  LOVE: { emoji: '❤️', label: 'love', color: 'text-red-500' },
  LIKE: { emoji: '👍', label: 'like', color: 'text-blue-500' },
  SURPRISE: { emoji: '😮', label: 'surprise', color: 'text-yellow-500' },
  CLAP: { emoji: '👏', label: 'applause', color: 'text-green-500' },
  SAD: { emoji: '😢', label: 'sad', color: 'text-gray-500' },
};

export default function ReactionsModal({ isOpen, onClose, postId, initialTab = 'all', anchorRef }: ReactionsModalProps) {
  const t = useTranslations('Reactions');
  const { token, isAuthenticated } = useAuth();
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<ReactionType | 'all'>(initialTab);
  const [total, setTotal] = useState(0);

  // Fetch reactions from API
  const fetchReactions = useCallback(async () => {
    if (!postId || !isOpen) return;

    // Skip API call for mock posts
    if (postId.startsWith('mock-')) {
      setIsLoading(false);
      // Set some mock data for demo purposes
      setReactionGroups([
        {
          type: 'LOVE',
          emoji: '❤️',
          count: 3,
          users: [
            { id: '1', name: 'Maria Silva', avatar: '/icons/avatar.svg' },
            { id: '2', name: 'João Santos', avatar: '/icons/avatar.svg' },
            { id: '3', name: 'Ana Costa', avatar: '/icons/avatar.svg' },
          ],
          hasCurrentUserReacted: true,
        },
        {
          type: 'LIKE',
          emoji: '👍',
          count: 2,
          users: [
            { id: '4', name: 'Pedro Oliveira', avatar: '/icons/avatar.svg' },
            { id: '5', name: 'Carla Mendes', avatar: '/icons/avatar.svg' },
          ],
          hasCurrentUserReacted: false,
        },
      ]);
      setTotal(5);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!token || !isAuthenticated) {
        setError('Not authenticated');
        return;
      }

      console.log('Fetching reactions for post:', postId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${postId}/reactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ReactionsResponse = await response.json();
      console.log('Reactions API response:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch reactions');
      }

      // Sort reaction groups by count (descending)
      const sortedGroups = [...data.reactions].sort((a, b) => b.count - a.count);
      setReactionGroups(sortedGroups);
      setTotal(data.total || 0);

    } catch (err) {
      console.error('Error fetching reactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reactions');
    } finally {
      setIsLoading(false);
    }
  }, [postId, isOpen, token, isAuthenticated]);

  // Fetch reactions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchReactions();
    }
  }, [isOpen, fetchReactions]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReactionGroups([]);
      setError(null);
      setSelectedTab('all');
    }
  }, [isOpen]);

  // Get users for selected tab
  const getFilteredUsers = () => {
    if (selectedTab === 'all') {
      // Combine all users from all reaction types
      const allUsers: User[] = [];
      reactionGroups.forEach(group => {
        allUsers.push(...group.users);
      });
      return allUsers;
    }
    
    // Find specific reaction group
    const group = reactionGroups.find(g => g.type === selectedTab);
    return group?.users || [];
  };

  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate position based on anchor element
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const modalWidth = 320; // Fixed width for Instagram-like modal
      const modalHeight = 400; // Max height
      
      // Position to the right of the anchor, aligned with bottom
      let left = rect.right + 8;
      let top = rect.bottom - modalHeight;
      
      // Adjust if modal would go off screen horizontally
      if (left + modalWidth > window.innerWidth - 20) {
        // Try positioning to the left
        left = rect.left - modalWidth - 8;
        
        // If still off screen, center it horizontally
        if (left < 20) {
          left = (window.innerWidth - modalWidth) / 2;
        }
      }
      
      // Adjust vertical position
      if (top < 20) {
        top = rect.bottom + 8; // Position below if not enough space above
      }
      
      if (top + modalHeight > window.innerHeight - 20) {
        top = window.innerHeight - modalHeight - 20;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 w-80 bg-secondary rounded-xl shadow-2xl border border-secondary-dark overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Header */}
        {/* Header */}
        <div className="p-3 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <h3 className="text-primary font-semibold text-base">
              {t('reactions')}
            </h3>
            <button
              onClick={onClose}
              className="text-primary/60 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Reaction type tabs - Instagram style */}
        <div className="flex border-b border-primary/20">
          {/* All tab */}
          <button
            onClick={() => setSelectedTab('all')}
            className={cn(
              "flex-1 py-3 text-center transition-colors relative",
              selectedTab === 'all' 
                ? "text-primary" 
                : "text-primary/50 hover:text-primary/80"
            )}
          >
            <span className="text-sm font-medium">All</span>
            <span className="text-xs text-primary/60 ml-1">{total}</span>
            {selectedTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          
          {/* Reaction type tabs */}
          {reactionGroups
            .filter(group => group.count > 0)
            .map((group) => (
              <button
                key={group.type}
                onClick={() => setSelectedTab(group.type)}
                className={cn(
                  "flex-1 py-3 text-center transition-colors relative",
                  selectedTab === group.type
                    ? "text-primary"
                    : "text-primary/50 hover:text-primary/80"
                )}
              >
                <span className="text-lg">{reactionConfig[group.type].emoji}</span>
                <span className="text-xs text-primary/60 ml-1">{group.count}</span>
                {selectedTab === group.type && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8 px-4">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={() => fetchReactions()}
                className="text-primary text-sm hover:underline"
              >
                {t('retry')}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && getFilteredUsers().length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-primary/60 text-sm">
                {selectedTab === 'all' ? t('noReactions') : t('noReactionsOfType')}
              </p>
            </div>
          )}

          {/* User list - Instagram style */}
          {!error && getFilteredUsers().length > 0 && (
            <div className="py-2">
              {getFilteredUsers().map((user, index) => {
                // Find which reaction type(s) this user has
                const userReactions: ReactionType[] = [];
                if (selectedTab !== 'all') {
                  userReactions.push(selectedTab);
                } else {
                  // Find all reaction types this user has
                  for (const group of reactionGroups) {
                    if (group.users.some(u => u.id === user.id)) {
                      userReactions.push(group.type);
                    }
                  }
                }

                return (
                  <div
                    key={`${user.id}-${index}`}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                      <Image
                        src={user.avatar || '/icons/avatar.svg'}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* User name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-primary text-sm font-medium truncate">{user.name}</p>
                    </div>

                    {/* Reaction emojis */}
                    <div className="flex gap-1 flex-shrink-0">
                      {userReactions.map(type => (
                        <span key={type} className="text-base">
                          {reactionConfig[type].emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}