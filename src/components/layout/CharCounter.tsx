'use client';

import { cn } from '@/lib/utils';

interface Props {
  current: number;
  max: number;
}

export default function CharCounter({ current, max }: Props) {
  const pct = current / max;
  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        pct >= 1 ? 'text-red-500 font-semibold' : pct >= 0.8 ? 'text-amber-500' : 'text-zinc-400'
      )}
    >
      {current}/{max}
    </span>
  );
}
