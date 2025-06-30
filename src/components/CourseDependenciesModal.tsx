'use client';

import { useTranslations } from 'next-intl';
import {
  X,
  AlertTriangle,
  Package,
  Route,
  Play,
  Video,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface Dependency {
  type: 'module' | 'track';
  id: string;
  name: string;
  description: string;
  actionRequired: string;
  relatedEntities?: {
    lessons?: number;
    videos?: number;
  };
}

interface DependenciesData {
  error: string;
  message: string;
  canDelete: boolean;
  dependencies: Dependency[];
  summary: {
    modules: number;
    tracks: number;
    lessons: number;
    videos: number;
  };
  totalDependencies: number;
  actionRequired: string;
}

interface CourseDependenciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  dependenciesData: DependenciesData | null;
  onProceed?: () => void;
}

export default function CourseDependenciesModal({
  isOpen,
  onClose,
  courseName,
  dependenciesData,
  onProceed,
}: CourseDependenciesModalProps) {
  const t = useTranslations('Admin.courseDependencies');

  if (!isOpen || !dependenciesData) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'module':
        return (
          <Package size={20} className="text-blue-400" />
        );
      case 'track':
        return (
          <Route size={20} className="text-purple-400" />
        );
      default:
        return (
          <AlertTriangle
            size={20}
            className="text-yellow-400"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0 bg-red-900/20">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle
                size={28}
                className="text-red-400"
              />
              {t('title')}
            </h2>
            <p className="text-gray-300 mt-1">
              {t('subtitle', { courseName })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <Package
                size={24}
                className="text-blue-400 mx-auto mb-2"
              />
              <p className="text-2xl font-bold text-white">
                {dependenciesData.summary.modules}
              </p>
              <p className="text-sm text-gray-400">
                {t('stats.modules')}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <Route
                size={24}
                className="text-purple-400 mx-auto mb-2"
              />
              <p className="text-2xl font-bold text-white">
                {dependenciesData.summary.tracks}
              </p>
              <p className="text-sm text-gray-400">
                {t('stats.tracks')}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <Play
                size={24}
                className="text-green-400 mx-auto mb-2"
              />
              <p className="text-2xl font-bold text-white">
                {dependenciesData.summary.lessons}
              </p>
              <p className="text-sm text-gray-400">
                {t('stats.lessons')}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <Video
                size={24}
                className="text-orange-400 mx-auto mb-2"
              />
              <p className="text-2xl font-bold text-white">
                {dependenciesData.summary.videos}
              </p>
              <p className="text-sm text-gray-400">
                {t('stats.videos')}
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={24}
                className="text-yellow-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">
                  {t('warning.title')}
                </h4>
                <p className="text-gray-300 text-sm">
                  {t('warning.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Dependencies List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t('dependencies.title')}
            </h3>

            {dependenciesData.dependencies.map(dep => (
              <div
                key={dep.id}
                className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(dep.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-semibold">
                          {dep.name}
                        </h4>
                        <p className="text-gray-400 text-sm mt-1">
                          {dep.description}
                        </p>
                      </div>
                      {dep.relatedEntities && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          {dep.relatedEntities.lessons !==
                            undefined && (
                            <span className="flex items-center gap-1">
                              <Play size={12} />
                              {
                                dep.relatedEntities.lessons
                              }{' '}
                              {t('dependencies.lessons')}
                            </span>
                          )}
                          {dep.relatedEntities.videos !==
                            undefined && (
                            <span className="flex items-center gap-1">
                              <Video size={12} />
                              {
                                dep.relatedEntities.videos
                              }{' '}
                              {t('dependencies.videos')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <ChevronRight
                        size={16}
                        className="text-red-400"
                      />
                      <p className="text-red-400 text-sm">
                        {dep.actionRequired}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Steps */}
          <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trash2 size={20} className="text-red-400" />
              {t('steps.title')}
            </h4>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-semibold">
                  1.
                </span>
                {t('steps.step1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-semibold">
                  2.
                </span>
                {t('steps.step2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-semibold">
                  3.
                </span>
                {t('steps.step3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-semibold">
                  4.
                </span>
                {t('steps.step4')}
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0 bg-gray-900/50">
          <p className="text-sm text-gray-400">
            {t('footer.total', {
              count: dependenciesData.totalDependencies,
            })}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t('buttons.understand')}
            </button>
            {onProceed && (
              <button
                onClick={onProceed}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                {t('buttons.proceedAnyway')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
