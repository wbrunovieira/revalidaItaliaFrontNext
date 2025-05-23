// src/components/AuthLayout.tsx
import React from 'react';
import ImageSection from './ImageSection';
import AuthPanel from './AuthPanel';

export default function AuthLayout() {
  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <ImageSection />
      <AuthPanel />
    </div>
  );
}
