// src/components/Footer.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Code2, Heart, Sparkles, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto bg-[#0C3559]">
      {/* Animated gradient border using project colors */}
      <div className="absolute inset-x-0 top-0 h-[1px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3887A6]/40 to-transparent animate-shimmer-reverse" />
      </div>
      
      {/* Main footer content with project color gradients */}
      <div className="relative bg-gradient-to-b from-[#0C3559] via-[#0F2940] to-[#0C3559]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3887A6]/[0.05] via-transparent to-black/[0.1]" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Main content row */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-4">
              {/* Left side - Copyright with subtle animation */}
              <div className="group flex items-center gap-2 order-2 md:order-1">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-[#3887A6]/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative text-white/90 text-sm flex items-center gap-2">
                    <span className="text-[#3887A6]">©</span>
                    <span className="font-light text-white/70">{currentYear}</span>
                    <span className="font-medium bg-gradient-to-r from-white to-[#3887A6] bg-clip-text text-transparent">Revalida Italia</span>
                    <span className="hidden sm:inline text-[#3887A6]/70">•</span>
                    <span className="hidden sm:inline text-white/60">{t('rightsReserved')}</span>
                  </div>
                </div>
              </div>

              {/* Center - Developed by with enhanced styling */}
              <div className="flex items-center gap-3 order-1 md:order-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/70 font-light">{t('developedWith')}</span>
                  <div className="relative">
                    <Heart className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                    <div className="absolute inset-0 blur-sm bg-white/30 animate-pulse" />
                  </div>
                  <span className="text-white/70 font-light">{t('by')}</span>
                </div>
                
                <Link
                  href="https://www.wbdigitalsolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link relative"
                >
                  {/* Hover effect background */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-white/10 via-[#3887A6]/20 to-white/10 rounded-lg opacity-0 group-hover/link:opacity-100 blur-xl transition duration-500" />
                  
                  {/* Link content */}
                  <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-gradient-to-r from-white/10 to-[#3887A6]/10 group-hover/link:border-white/40 group-hover/link:from-white/20 group-hover/link:to-[#3887A6]/20 transition-all duration-300">
                    <Code2 className="w-4 h-4 text-white group-hover/link:text-white group-hover/link:rotate-12 transition-transform duration-300" />
                    <span className="font-medium text-white group-hover/link:text-white transition-all duration-300">
                      WB Digital Solutions
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-white/60 group-hover/link:text-white transition-all duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </div>
                </Link>
              </div>

              {/* Right side - Quality badge */}
              <div className="order-3 md:order-3">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-[#3887A6]/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-white/20 bg-gradient-to-r from-white/10 to-[#3887A6]/10">
                    <Sparkles className="w-3 h-3 text-white/70" />
                    <span className="font-light text-white/80">{t('craftedWithExcellence')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}