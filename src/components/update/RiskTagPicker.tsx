'use client';

import { cn } from '@/lib/utils';
import { RISK_TAG_OPTIONS } from '@/data/streakMessages';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function RiskTagPicker({ selected, onChange }: Props) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {RISK_TAG_OPTIONS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            selected.includes(tag)
              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
