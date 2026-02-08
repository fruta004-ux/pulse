'use client';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={cn('transition-all duration-200', sidebarCollapsed ? 'ml-16' : 'ml-56')}>
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
