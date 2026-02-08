'use client';

import StatusBadge from '@/components/layout/StatusBadge';
import { getTeamReports, formatRelativeDate } from '@/lib/statusCalc';
import type { DbWeeklyReport } from '@/types/database';

interface Props {
  reports: DbWeeklyReport[];
  teamId: string;
}

export default function ReportTimeline({ reports, teamId }: Props) {
  const teamReports = getTeamReports(reports, teamId);

  if (teamReports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
        리포트가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-800">📅 주간 리포트 타임라인</h3>
      <div className="space-y-3">
        {teamReports.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} size="sm" />
                <span className="text-sm font-medium text-zinc-700">
                  {new Date(r.week_start_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 주차
                </span>
              </div>
              <span className="text-xs text-zinc-400">{formatRelativeDate(r.created_at)}</span>
            </div>
            <p className="text-sm text-zinc-800 font-medium">{r.headline}</p>
            {r.anomalies?.length > 0 && (
              <div className="text-xs text-zinc-500">
                {r.anomalies.map((a, i) => <p key={i}>⚠ {a}</p>)}
              </div>
            )}
            <p className="text-xs text-indigo-600">→ {r.next_action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
