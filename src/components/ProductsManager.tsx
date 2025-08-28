'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Package, RefreshCw, List } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import ProductsList from '@/components/ProductsList';
import SyncProducts from '@/components/SyncProducts';

export default function ProductsManager() {
  const t = useTranslations('Admin.productsManager');
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="text-secondary" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-gray-400">{t('description')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-gray-800 p-1">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
          >
            <List size={16} />
            {t('tabs.list')}
          </TabsTrigger>
          <TabsTrigger 
            value="sync" 
            className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t('tabs.sync')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <ProductsList />
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <SyncProducts />
        </TabsContent>
      </Tabs>
    </div>
  );
}