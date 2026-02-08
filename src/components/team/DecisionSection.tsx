'use client';

import { getUserNameById } from '@/lib/statusCalc';
import type { DbDecisionLog, DbUser } from '@/types/database';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  decisions: DbDecisionLog[];
  teamId: string;
  users: DbUser[];
}

export default function DecisionSection({ decisions, teamId, users }: Props) {
  const teamDecisions = decisions.filter((d) => d.team_id === teamId);

  if (teamDecisions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400">
        등록된 결정 사항이 없습니다
      </div>
    );
  }

  const stateConfig = {
    pending: { icon: AlertCircle, label: '대기중', color: 'text-amber-500' },
    decided: { icon: CheckCircle2, label: '결정됨', color: 'text-emerald-500' },
    followup_done: { icon: Clock, label: '후속완료', color: 'text-indigo-500' },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-800">⚖️ 결정 로그</h3>
      <div className="space-y-3">
        {teamDecisions.map((d) => {
          const config = stateConfig[d.state];
          const Icon = config.icon;
          return (
            <div key={d.id} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-zinc-800">{d.title}</p>
                <span className={cn('flex items-center gap-1 text-xs font-medium', config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
              </div>
              {d.context && <p className="text-xs text-zinc-500">{d.context}</p>}
              {(d.option_a || d.option_b) && (
                <div className="grid grid-cols-2 gap-2">
                  {d.option_a && (
                    <div className={cn('rounded-lg border p-2 text-xs', d.decision?.includes('A') ? 'border-indigo-300 bg-indigo-50' : 'border-zinc-200')}>
                      <span className="font-semibold text-indigo-600">A.</span> {d.option_a}
                    </div>
                  )}
                  {d.option_b && (
                    <div className={cn('rounded-lg border p-2 text-xs', d.decision?.includes('B') ? 'border-indigo-300 bg-indigo-50' : 'border-zinc-200')}>
                      <span className="font-semibold text-indigo-600">B.</span> {d.option_b}
                    </div>
                  )}
                </div>
              )}
              {d.decision && (
                <div className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
                  <span className="font-medium">결정:</span> {d.decision}
                </div>
              )}
              {d.comment && (
                <p className="text-xs text-zinc-600 italic">&ldquo;{d.comment}&rdquo;</p>
              )}
              <div className="text-xs text-zinc-400">
                {d.decided_by && `결정자: ${getUserNameById(users, d.decided_by)}`}
                {d.followup_date && ` · 후속 점검: ${new Date(d.followup_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
