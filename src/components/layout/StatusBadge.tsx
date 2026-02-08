'use client';

import { cn } from '@/lib/utils';
import type { TeamStatus } from '@/types/database';

const config: Record<TeamStatus, { label: string; emoji: string; bg: string; text: string; ring: string }> = {
  green: { label: '정상', emoji: '🟢', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  yellow: { label: '주의', emoji: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  red: { label: '위험', emoji: '🔴', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
};

interface Props {
  status: TeamStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StatusBadge({ status, size = 'md', showLabel = true }: Props) {
  const c = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full ring-1 font-medium',
        c.bg, c.text, c.ring,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        size === 'lg' && 'px-3 py-1.5 text-base'
      )}
    >
      <span>{c.emoji}</span>
      {showLabel && <span>{c.label}</span>}
    </span>
  );
}
