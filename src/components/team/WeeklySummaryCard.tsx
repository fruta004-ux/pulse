'use client';

import StatusBadge from '@/components/layout/StatusBadge';
import type { DbWeeklyReport } from '@/types/database';
import { AlertTriangle } from 'lucide-react';

interface Props {
  report: DbWeeklyReport | undefined;
}

export default function WeeklySummaryCard({ report }: Props) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-400">
        아직 이번 주 리포트가 없습니다
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-800">📋 이번 주 요약</h3>
        <StatusBadge status={report.status} size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500 mb-1">핵심 진행</p>
          <p className="text-sm text-zinc-800 font-medium">{report.headline}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500 mb-1">다음 액션</p>
          <p className="text-sm text-indigo-600 font-medium">→ {report.next_action}</p>
        </div>
      </div>
      {report.anomalies?.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> 특이사항
          </p>
          {report.anomalies.map((a, i) => (
            <p key={i} className="text-sm text-zinc-700">· {a}</p>
          ))}
        </div>
      )}
      {report.risk_tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {report.risk_tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
