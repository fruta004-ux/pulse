import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  updateModalOpen: boolean;
  updateModalTeamId: string | null;
  toggleSidebar: () => void;
  openUpdateModal: (teamId?: string) => void;
  closeUpdateModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  updateModalOpen: false,
  updateModalTeamId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openUpdateModal: (teamId) =>
    set({ updateModalOpen: true, updateModalTeamId: teamId ?? null }),
  closeUpdateModal: () =>
    set({ updateModalOpen: false, updateModalTeamId: null }),
}));
