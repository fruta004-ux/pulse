'use client';

import { usePulseData } from '@/hooks/usePulseData';
import { getUserNameById } from '@/lib/statusCalc';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import type { DecisionState } from '@/types/database';

const stateConfig: Record<DecisionState, { icon: typeof AlertCircle; label: string; color: string; bg: string }> = {
  pending: { icon: AlertCircle, label: '대기중', color: 'text-amber-500', bg: 'bg-amber-50/50 border-amber-200' },
  decided: { icon: CheckCircle2, label: '결정됨', color: 'text-green-500', bg: 'bg-green-50/50 border-green-200' },
  followup_done: { icon: Clock, label: '후속완료', color: 'text-blue-500', bg: 'bg-blue-50/50 border-blue-200' },
};

export default function DecisionsPage() {
  const { teams, users, decisions, loading, error } = usePulseData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-red-500 font-medium">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? '알 수 없음';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결정 로그</h1>
          <p className="text-sm text-gray-500">대표/임원의 의사결정 기록 및 후속 점검</p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
          등록된 결정 사항이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => {
            const config = stateConfig[d.state];
            const Icon = config.icon;
            return (
              <div key={d.id} className={cn('rounded-2xl border-2 p-5 space-y-3 shadow-sm', config.bg)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-900">{d.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{getTeamName(d.team_id)}</p>
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-semibold', config.color)}>
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </span>
                </div>

                {d.context && <p className="text-sm text-gray-600 leading-relaxed">{d.context}</p>}

                {(d.option_a || d.option_b) && (
                  <div className="grid grid-cols-2 gap-3">
                    {d.option_a && (
                      <div className={cn('rounded-xl border bg-white p-3 text-sm', d.decision?.includes('A') ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200')}>
                        <span className="font-bold text-blue-600">A.</span> {d.option_a}
                      </div>
                    )}
                    {d.option_b && (
                      <div className={cn('rounded-xl border bg-white p-3 text-sm', d.decision?.includes('B') ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200')}>
                        <span className="font-bold text-blue-600">B.</span> {d.option_b}
                      </div>
                    )}
                  </div>
                )}

                {d.recommendation && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
                    💡 추천: {d.recommendation}
                  </div>
                )}

                {d.decision && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                    <span className="font-bold">결정:</span> {d.decision}
                  </div>
                )}

                {d.comment && (
                  <p className="text-sm text-gray-600 italic pl-3 border-l-2 border-gray-300">&ldquo;{d.comment}&rdquo;</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {d.decided_by && <span>결정자: {getUserNameById(users, d.decided_by)}</span>}
                  {d.decided_at && <span>결정일: {new Date(d.decided_at).toLocaleDateString('ko-KR')}</span>}
                  {d.followup_date && <span>후속 점검: {new Date(d.followup_date).toLocaleDateString('ko-KR')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
