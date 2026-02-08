'use client';

import type { DbWeeklyReport } from '@/types/database';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface Props {
  report: DbWeeklyReport;
  teamName: string;
  ownerName: string;
}

export default function DecisionCard({ report, teamName, ownerName }: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800">{teamName}</span>
        </div>
        {report.due_date && (
          <span className="text-xs text-amber-600 font-medium">
            마감 {new Date(report.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-700 leading-relaxed">{report.decision_reason}</p>
      <div className="grid grid-cols-2 gap-2">
        {report.option_a && (
          <div className={cn('rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-700')}>
            <span className="font-semibold text-indigo-600">A.</span> {report.option_a}
          </div>
        )}
        {report.option_b && (
          <div className={cn('rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-700')}>
            <span className="font-semibold text-indigo-600">B.</span> {report.option_b}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500">담당: {ownerName}</p>
    </div>
  );
}
