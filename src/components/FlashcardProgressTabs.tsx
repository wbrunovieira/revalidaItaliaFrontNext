// src/components/FlashcardProgressTabs.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FlashcardProgressContent from '@/components/FlashcardProgressContent';
import FlashcardsByArgument from '@/components/FlashcardsByArgument';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart3,
  Layers,
} from 'lucide-react';

export default function FlashcardProgressTabs() {
  const t = useTranslations('FlashcardProgress');
  const [activeTab, setActiveTab] = useState('progress');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-24 sm:pt-20 lg:pt-12">
          <TabsList className="relative mb-6 h-auto w-full gap-1 bg-transparent p-0">
            <TabsTrigger
              value="progress"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <BarChart3
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.progress')}
            </TabsTrigger>

            <TabsTrigger
              value="byArgument"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Layers
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.byArgument')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="progress" className="mt-0">
          <FlashcardProgressContent />
        </TabsContent>

        <TabsContent value="byArgument" className="mt-0">
          <div className="px-4 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('byArgument.title')}</h1>
                <p className="text-gray-400">{t('byArgument.subtitle')}</p>
              </div>

              <FlashcardsByArgument />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
