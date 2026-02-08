'use client';

import DecisionCard from './DecisionCard';
import type { DbWeeklyReport, DbTeam, DbUser } from '@/types/database';
import { getLatestReport, getUserNameById } from '@/lib/statusCalc';

interface Props {
  reports: DbWeeklyReport[];
  teams: DbTeam[];
  users: DbUser[];
}

export default function DecisionTop3({ reports, teams, users }: Props) {
  const pending = teams
    .map((t) => {
      const latest = getLatestReport(reports, t.id);
      if (!latest?.exec_decision_needed) return null;
      return { report: latest, team: t };
    })
    .filter(Boolean)
    .slice(0, 3) as { report: DbWeeklyReport; team: DbTeam }[];

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
        현재 결정이 필요한 항목이 없습니다 ✨
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-zinc-900">
        🔔 지금 대표가 봐야 할 것 <span className="text-sm font-normal text-zinc-500">TOP {pending.length}</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {pending.map(({ report, team }) => (
          <DecisionCard
            key={report.id}
            report={report}
            teamName={team.name}
            ownerName={getUserNameById(users, report.created_by ?? '')}
          />
        ))}
      </div>
    </div>
  );
}
