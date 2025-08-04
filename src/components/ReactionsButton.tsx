'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, ThumbsUp, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type ReactionType = 'LOVE' | 'LIKE' | 'SURPRISE' | 'CLAP' | 'SAD';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionsButtonProps {
  reactions: Reaction[];
  onReact: (type: ReactionType) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const reactionEmojis: Record<ReactionType, string> = {
  LOVE: '❤️',
  LIKE: '👍',
  SURPRISE: '😮',
  CLAP: '👏',
  SAD: '😢'
};

export default function ReactionsButton({ 
  reactions, 
  onReact, 
  size = 'md',
  className 
}: ReactionsButtonProps) {
  const t = useTranslations('Reactions');
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

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

  // Get most reacted type or default to heart
  const mostReacted = reactions.reduce((prev, current) => 
    current.count > prev.count ? current : prev
  , reactions[0]);

  const hasAnyReaction = reactions.some(r => r.hasReacted);
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  const handleReaction = (type: ReactionType) => {
    onReact(type);
    setShowPicker(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'px-2 py-1 text-xs gap-1',
          emoji: 'text-sm',
          picker: 'p-1.5 gap-1',
          pickerEmoji: 'text-lg p-1'
        };
      case 'lg':
        return {
          button: 'px-4 py-2 text-base gap-2',
          emoji: 'text-xl',
          picker: 'p-3 gap-2',
          pickerEmoji: 'text-3xl p-2'
        };
      default:
        return {
          button: 'px-3 py-1.5 text-sm gap-1.5',
          emoji: 'text-base',
          picker: 'p-2 gap-1.5',
          pickerEmoji: 'text-2xl p-1.5'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="relative inline-block" style={{ zIndex: showPicker ? 50 : 'auto' }}>
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "flex items-center rounded-full transition-all duration-200",
          "hover:bg-gray-800 hover:scale-105",
          hasAnyReaction ? "text-white bg-gray-800/50" : "text-gray-500",
          sizeClasses.button,
          className
        )}
      >
        {/* Show all reactions with opacity based on count */}
        {reactions
          .slice(0, 3)
          .map((r) => (
            <span 
              key={r.type} 
              className={cn(
                sizeClasses.emoji,
                r.count === 0 && !r.hasReacted && "opacity-40"
              )}
            >
              {reactionEmojis[r.type]}
            </span>
          ))}
        {totalReactions > 0 && (
          <span className="font-medium">{totalReactions}</span>
        )}
      </button>

      {/* Reaction Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
            "bg-gray-900 rounded-full shadow-xl border border-gray-700",
            "flex items-center",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sizeClasses.picker
          )}
        >
          {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => {
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
                  "relative rounded-full transition-all duration-200",
                  "hover:scale-125 hover:bg-gray-800",
                  hasReacted && "bg-gray-800",
                  sizeClasses.pickerEmoji
                )}
              >
                <span className={cn(
                  "block transform transition-transform duration-200",
                  reaction?.count === 0 && !hasReacted && "opacity-50"
                )}>
                  {reactionEmojis[type]}
                </span>
                
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {t(type === 'LOVE' ? 'love' : type === 'LIKE' ? 'like' : type === 'SURPRISE' ? 'wow' : type === 'CLAP' ? 'applause' : 'sad')}
                      {reaction && reaction.count > 0 && (
                        <span className="ml-1 text-gray-400">({reaction.count})</span>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}