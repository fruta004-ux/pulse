'use client';

import { usePulseData } from '@/hooks/usePulseData';
import TeamCardGrid from '@/components/dashboard/TeamCardGrid';
import UpdateModal from '@/components/update/UpdateModal';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { users, teams, reports, issues, actions, decisions, loading, error, refresh } = usePulseData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-500 font-semibold text-lg">데이터를 불러올 수 없습니다</p>
        <div className="max-w-md rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
        <button onClick={refresh} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-600/30">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 팀 카드 그리드 — 이슈 제목만 표시 */}
      <TeamCardGrid teams={teams} issues={issues} />

      {/* Update Modal */}
      <UpdateModal teams={teams} reports={reports} users={users} onSuccess={refresh} />
    </div>
  );
}
