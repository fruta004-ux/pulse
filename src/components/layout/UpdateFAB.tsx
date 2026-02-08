'use client';

import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export default function UpdateFAB() {
  const { openUpdateModal } = useUIStore();

  return (
    <button
      onClick={() => openUpdateModal()}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors md:hidden"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
