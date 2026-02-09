'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useFilterStore } from '@/stores/useFilterStore';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TopBar() {
  const { openUpdateModal } = useUIStore();
  const { searchQuery, setSearchQuery } = useFilterStore();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md px-6">
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="팀, 이슈, 담당자 검색..."
          className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all duration-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => openUpdateModal()}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-10 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          업데이트
        </Button>

        {/* 사용자 정보 + 로그아웃 */}
        {userEmail && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500 max-w-[160px] truncate">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors duration-200 px-2 py-1.5 rounded-lg hover:bg-red-50"
              title="로그아웃"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
