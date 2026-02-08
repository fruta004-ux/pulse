import { create } from 'zustand';
import type { TeamStatus } from '@/types/database';

type SortKey = 'risk' | 'deadline' | 'recent' | 'worsened';

interface FilterState {
  statusFilter: TeamStatus | 'all';
  needsDecision: boolean;
  staleOnly: boolean;
  searchQuery: string;
  sortBy: SortKey;
  setStatusFilter: (v: TeamStatus | 'all') => void;
  setNeedsDecision: (v: boolean) => void;
  setStaleOnly: (v: boolean) => void;
  setSearchQuery: (v: string) => void;
  setSortBy: (v: SortKey) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  statusFilter: 'all',
  needsDecision: false,
  staleOnly: false,
  searchQuery: '',
  sortBy: 'risk',
  setStatusFilter: (v) => set({ statusFilter: v }),
  setNeedsDecision: (v) => set({ needsDecision: v }),
  setStaleOnly: (v) => set({ staleOnly: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setSortBy: (v) => set({ sortBy: v }),
  resetFilters: () =>
    set({
      statusFilter: 'all',
      needsDecision: false,
      staleOnly: false,
      searchQuery: '',
      sortBy: 'risk',
    }),
}));
