// /src/components/LanguageButton.tsx
// src/components/LanguageButton.tsx
'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link,
  usePathname as useBasePath,
} from '@/i18n/navigation';

interface Tab {
  label: string;
  flag: string;
}

export default function LanguageButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  
  const tabs: Tab[] = [
    { label: 'PT', flag: '🇧🇷' },
    { label: 'IT', flag: '🇮🇹' },
    { label: 'ES', flag: '🇪🇸' },
  ];

  const searchParams = useSearchParams();
  const suffix = searchParams.toString()
    ? `?${searchParams.toString()}`
    : '';

  const basePath = useBasePath() ?? '';

  const locale = useLocale().toUpperCase();
  const idx = tabs.findIndex(tab => tab.label === locale);
  const activeIndex = idx >= 0 ? idx : 0;

  const handleClick = (index: number) => {
    setClickedIndex(index);
    // Reset click animation after a short delay
    setTimeout(() => setClickedIndex(null), 400);
  };

  return (
    <motion.div 
      className="relative bg-secondary shadow-[0_0_1px_rgba(24,94,224,0.15),0_6px_12px_rgba(24,94,224,0.15)] p-1 rounded-full inline-block"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 400,
        damping: 25 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 0 20px rgba(56, 135, 166, 0.3), 0 10px 20px rgba(24, 94, 224, 0.2)"
      }}
    >
      <div className="relative flex">
        {/* Animated indicator with spring physics */}
        <motion.span
          className="absolute top-0 left-0 h-[30px] w-[50px] rounded-full z-0 overflow-hidden"
          initial={false}
          animate={{
            x: `${activeIndex * 100}%`,
            background: isHovered 
              ? 'linear-gradient(135deg, #0C3559 0%, #3887A6 100%)' 
              : '#0C3559'
          }}
          transition={{
            x: {
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            },
            background: {
              duration: 0.3
            }
          }}
        >
          {/* Shimmer effect on active - single pass, contained within button */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              width: '100%'
            }}
            key={`shimmer-${activeIndex}`} // Reset animation when active index changes
            initial={{ x: '-100%' }}
            animate={{ x: '50%' }} // Stop in the middle of the button
            transition={{
              duration: 0.6,
              delay: 0.2, // Small delay after indicator moves
              ease: "easeOut"
            }}
          />
        </motion.span>

        {tabs.map((tab, i) => (
          <Link
            key={tab.label}
            href={`${basePath}${suffix}`}
            locale={tab.label.toLowerCase()}
            onClick={() => handleClick(i)}
            className="relative z-10"
          >
            <motion.div
              className={`
                relative flex items-center justify-center
                h-[30px] w-[50px] text-[0.6rem] font-medium rounded-full
                cursor-pointer select-none
              `}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: i * 0.05,
                type: "spring",
                stiffness: 300
              }}
              whileHover={{ 
                scale: activeIndex !== i ? 1.1 : 1,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Click ripple effect */}
              <AnimatePresence>
                {clickedIndex === i && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-white"
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </AnimatePresence>

              {/* Text content with flag */}
              <motion.span
                className="relative flex items-center gap-1"
                animate={{
                  color: activeIndex === i ? '#ffffff' : '#0C3559',
                  filter: activeIndex === i ? 'none' : isHovered ? 'brightness(1.2)' : 'none'
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Flag with bounce animation on active */}
                <motion.span
                  className="text-[0.5rem]"
                  animate={{
                    scale: activeIndex === i ? 1 : 0.8,
                    opacity: activeIndex === i ? 1 : 0.6
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15
                  }}
                >
                  {tab.flag}
                </motion.span>
                
                {/* Language code */}
                <span className="font-semibold">{tab.label}</span>
              </motion.span>

              {/* Hover glow effect for inactive items */}
              {activeIndex !== i && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(139, 202, 217, 0.1) 0%, transparent 70%)'
                  }}
                />
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
