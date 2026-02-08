'use client';

import { cn } from '@/lib/utils';
import type { TeamStatus } from '@/types/database';

interface Props {
  value: TeamStatus;
  onChange: (v: TeamStatus) => void;
}

const OPTIONS: { value: TeamStatus; emoji: string; label: string; desc: string; ring: string; bg: string }[] = [
  { value: 'green', emoji: '🟢', label: '정상', desc: '일정/품질/리소스 OK', ring: 'ring-emerald-300', bg: 'bg-emerald-50' },
  { value: 'yellow', emoji: '🟡', label: '주의', desc: '지연 위험 or 결정 필요', ring: 'ring-amber-300', bg: 'bg-amber-50' },
  { value: 'red', emoji: '🔴', label: '위험', desc: '지연 확정/클레임/즉시 결정', ring: 'ring-red-300', bg: 'bg-red-50' },
];

export default function StatusSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-xl border-2 p-3 text-center transition-all',
            value === o.value
              ? `${o.bg} ${o.ring} ring-2 border-transparent`
              : 'border-zinc-200 hover:border-zinc-300'
          )}
        >
          <div className="text-2xl mb-1">{o.emoji}</div>
          <div className="text-sm font-semibold text-zinc-800">{o.label}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{o.desc}</div>
        </button>
      ))}
    </div>
  );
}
