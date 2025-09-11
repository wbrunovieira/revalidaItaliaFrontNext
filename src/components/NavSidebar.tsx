// /src/components/NavSidebar.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import Nav from './Nav';
import Sidebar from './Sidebar';

interface NavSidebarProps {
  children: ReactNode;
}

export default function NavSidebar({
  children,
}: NavSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1280; // xl breakpoint
      setIsMobile(mobile);
      // Auto-close sidebar on mobile initially
      if (mobile) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="flex">
      <Nav collapsed={collapsed} onToggle={toggleSidebar} />

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      <main
        className={`
          flex-1 w-full
          transition-margin duration-300 ease-in-out
          ${/* Mobile: no margin, Desktop: margin based on sidebar state */''}
          ${isMobile ? 'ml-0' : collapsed ? 'xl:ml-20' : 'xl:ml-64'}
          pt-[7rem] sm:pt-24 xl:pt-16
          min-h-screen
        `}
      >
        {children}
      </main>
    </div>
  );
}