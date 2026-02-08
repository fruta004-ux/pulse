'use client';

import StatusBadge from '@/components/layout/StatusBadge';
import { getCompanyStatus, getPendingDecisionCount, isStale } from '@/lib/statusCalc';
import type { DbWeeklyReport } from '@/types/database';
import { AlertTriangle, Clock, FileQuestion } from 'lucide-react';

interface Props {
  reports: DbWeeklyReport[];
  teamIds: string[];
}

export default function StatusStrip({ reports, teamIds }: Props) {
  const companyStatus = getCompanyStatus(reports, teamIds);
  const redTeams = teamIds.filter((id) => {
    const latest = reports.find((r) => r.team_id === id);
    return latest?.status === 'red';
  }).length;
  const pendingDecisions = getPendingDecisionCount(reports, teamIds);
  const staleTeams = teamIds.filter((id) => isStale(reports, id)).length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">이번 주 회사 상태</span>
          <StatusBadge status={companyStatus} size="lg" />
        </div>
        <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-zinc-600">위험 팀</span>
            <span className="font-bold text-red-600">{redTeams}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileQuestion className="h-4 w-4 text-amber-500" />
            <span className="text-zinc-600">결정 필요</span>
            <span className="font-bold text-amber-600">{pendingDecisions}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-600">업데이트 누락</span>
            <span className="font-bold text-zinc-700">{staleTeams}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
