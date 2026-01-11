// src/components/3d-environments/registry.ts

import { ComponentType } from 'react';

export interface Environment3DProps {
  lessonId: string;
  locale: string;
  onComplete?: () => void;
}

type Environment3DComponent = ComponentType<Environment3DProps>;
type Environment3DLoader = () => Promise<{ default: Environment3DComponent }>;

export const environment3DRegistry: Record<string, Environment3DLoader> = {
  'human-body': () => import('./human-body'),
  'skeleton': () => import('./skeleton'),
  // Future environments:
  // 'heart-anatomy': () => import('./heart-anatomy'),
  // 'nervous-system': () => import('./nervous-system'),
};

export const isValidEnvironment = (slug: string): boolean => {
  return slug in environment3DRegistry;
};

export const getEnvironmentSlugs = (): string[] => {
  return Object.keys(environment3DRegistry);
};
