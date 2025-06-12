'use client';

import { ReactNode, useState } from 'react';
import Nav from './Nav';
import Sidebar from './Sidebar';

interface NavSidebarProps {
  children: ReactNode;
}

export default function NavSidebar({
  children,
}: NavSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="flex">
      <Nav collapsed={collapsed} onToggle={toggleSidebar} />

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      <main
        className={`flex-1 transition-margin duration-300 ease-in-out ${
          collapsed ? 'ml-20' : 'ml-64'
        } pt-14`}
      >
        {children}
      </main>
    </div>
  );
}
