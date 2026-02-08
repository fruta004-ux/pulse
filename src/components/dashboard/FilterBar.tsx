'use client';

import { useFilterStore } from '@/stores/useFilterStore';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FilterBar() {
  const { searchQuery, resetFilters } = useFilterStore();

  const hasActive = searchQuery.trim().length > 0;

  if (!hasActive) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">
        &quot;{searchQuery}&quot; 검색 결과
      </span>
      <button
        onClick={resetFilters}
        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 transition-all duration-200"
      >
        <X className="h-3 w-3" /> 초기화
      </button>
    </div>
  );
}
