'use client';

import { useState, useRef, useEffect } from 'react';
// Removed unused imports
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import ReactionsModal from './ReactionsModal';

export type ReactionType = 'LOVE' | 'LIKE' | 'SURPRISE' | 'CLAP' | 'SAD';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionsButtonProps {
  reactions: Reaction[];
  onReact: (type: ReactionType | null) => void;
  postId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  compact?: boolean;
}

const reactionEmojis: Record<ReactionType, string> = {
  LOVE: '❤️',
  LIKE: '👍',
  SURPRISE: '😮',
  CLAP: '👏',
  SAD: '😢',
};

export default function ReactionsButton({
  reactions,
  onReact,
  postId,
  size = 'md',
  className,
  compact = false,
}: ReactionsButtonProps) {
  const t = useTranslations('Reactions');
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<ReactionType | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAnyReaction = reactions.some(r => r.hasReacted);
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
  const currentUserReaction = reactions.find(r => r.hasReacted)?.type;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  const handleReaction = (type: ReactionType) => {
    console.log('🔘 [ReactionsButton] handleReaction called with:', type);
    console.log('🔘 [ReactionsButton] Current user reaction:', currentUserReaction);
    
    // Se clicou na mesma reação que já tem, remove ela (passa null)
    if (currentUserReaction === type) {
      console.log('🔘 [ReactionsButton] Removing reaction (same as current)');
      setIsRemoving(true);
      setAnimatingReaction(type);
      setTimeout(() => {
        console.log('🔘 [ReactionsButton] Calling onReact with null');
        onReact(null);
        setIsRemoving(false);
        setAnimatingReaction(null);
      }, 300); // Aguarda animação terminar
    } else {
      console.log('🔘 [ReactionsButton] Adding/changing reaction to:', type);
      setAnimatingReaction(type);
      onReact(type);
      setTimeout(() => {
        setAnimatingReaction(null);
      }, 300);
    }
    setShowPicker(false);
  };

  const getSizeClasses = () => {
    if (compact) {
      return {
        button: 'px-1.5 py-0.5 text-xs gap-0.5',
        emoji: 'text-xs',
        picker: 'p-1 gap-1',
        pickerEmoji: 'text-base p-0.5',
      };
    }

    switch (size) {
      case 'sm':
        return {
          button: 'px-2 py-1 text-xs gap-1',
          emoji: 'text-sm',
          picker: 'p-1.5 gap-1',
          pickerEmoji: 'text-lg p-1',
        };
      case 'lg':
        return {
          button: 'px-4 py-2 text-base gap-2',
          emoji: 'text-xl',
          picker: 'p-3 gap-2',
          pickerEmoji: 'text-3xl p-2',
        };
      default:
        return {
          button: 'px-3 py-1.5 text-sm gap-1.5',
          emoji: 'text-base',
          picker: 'p-2 gap-1.5',
          pickerEmoji: 'text-2xl p-1.5',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div ref={containerRef} className="relative inline-block" style={{ zIndex: showPicker ? 50 : 'auto' }}>
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          'flex items-center rounded-full transition-all duration-200',
          'hover:bg-gray-800 hover:scale-105',
          hasAnyReaction ? 'text-white bg-secondary/20 ring-1 ring-secondary/30' : 'text-gray-500',
          sizeClasses.button,
          className
        )}
      >
        {/* Se tem reação, mostra ela primeiro destacada */}
        {currentUserReaction ? (
          <>
            <span className={cn(
              sizeClasses.emoji,
              animatingReaction === currentUserReaction && isRemoving && 'animate-reaction-remove',
              animatingReaction === currentUserReaction && !isRemoving && 'animate-reaction-bounce',
              !animatingReaction && 'animate-pulse'
            )}>
              {reactionEmojis[currentUserReaction]}
            </span>
            {/* Mostra outras reações populares */}
            {reactions
              .filter(r => r.type !== currentUserReaction && r.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 2)
              .map(r => (
                <span key={r.type} className={cn(sizeClasses.emoji, 'opacity-60')}>
                  {reactionEmojis[r.type]}
                </span>
              ))}
          </>
        ) : (
          /* Se não tem reação, mostra as 3 mais populares */
          reactions
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(r => (
              <span key={r.type} className={cn(sizeClasses.emoji, r.count === 0 && 'opacity-40')}>
                {reactionEmojis[r.type]}
              </span>
            ))
        )}
        {totalReactions > 0 && (
          <span
            onClick={e => {
              e.stopPropagation();
              if (postId) {
                setShowReactionsModal(true);
              }
            }}
            className={cn(
              'font-medium px-2 py-0.5 rounded',
              postId && 'hover:bg-gray-700 cursor-pointer transition-colors'
            )}
          >
            {totalReactions}
          </span>
        )}
      </button>

      {/* Reaction Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
            'bg-gray-900 rounded-full shadow-xl border border-gray-700',
            'flex items-center',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            sizeClasses.picker
          )}
        >
          {(Object.keys(reactionEmojis) as ReactionType[]).map(type => {
            const reaction = reactions.find(r => r.type === type);
            const isHovered = hoveredReaction === type;
            const hasReacted = reaction?.hasReacted || false;

            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                onMouseEnter={() => setHoveredReaction(type)}
                onMouseLeave={() => setHoveredReaction(null)}
                className={cn(
                  'relative rounded-full transition-all duration-200',
                  'hover:scale-125',
                  hasReacted ? 'bg-secondary/20 ring-2 ring-secondary scale-110' : 'hover:bg-gray-800',
                  sizeClasses.pickerEmoji
                )}
              >
                <span
                  className={cn(
                    'block transform transition-all duration-200',
                    hasReacted && 'animate-pulse',
                    reaction?.count === 0 && !hasReacted && 'opacity-50',
                    isHovered && hasReacted && 'rotate-12'
                  )}
                >
                  {reactionEmojis[type]}
                </span>

                {/* Indicador de reação ativa */}
                {hasReacted && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
                )}

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50">
                    <div className={cn(
                      "text-white text-xs px-2 py-1 rounded whitespace-nowrap",
                      hasReacted ? "bg-red-600" : "bg-gray-800"
                    )}>
                      {hasReacted ? (
                        <>Remover {t(
                          type === 'LOVE'
                            ? 'love'
                            : type === 'LIKE'
                            ? 'like'
                            : type === 'SURPRISE'
                            ? 'wow'
                            : type === 'CLAP'
                            ? 'applause'
                            : 'sad'
                        )}</>
                      ) : (
                        <>
                          {t(
                            type === 'LOVE'
                              ? 'love'
                              : type === 'LIKE'
                              ? 'like'
                              : type === 'SURPRISE'
                              ? 'wow'
                              : type === 'CLAP'
                              ? 'applause'
                              : 'sad'
                          )}
                          {reaction && reaction.count > 0 && <span className="ml-1 text-gray-400">({reaction.count})</span>}
                        </>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className={cn(
                        "w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent",
                        hasReacted ? "border-t-red-600" : "border-t-gray-800"
                      )} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Reactions Modal */}
      {postId && (
        <ReactionsModal
          isOpen={showReactionsModal}
          onClose={() => setShowReactionsModal(false)}
          postId={postId}
          anchorRef={containerRef as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
}
