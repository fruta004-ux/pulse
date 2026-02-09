'use client';

import { use } from 'react';
import { usePulseData } from '@/hooks/usePulseData';
import TeamHeader from '@/components/team/TeamHeader';
import IssueTracker from '@/components/team/IssueTracker';
import ActionItemList from '@/components/team/ActionItemList';
import DecisionSection from '@/components/team/DecisionSection';
import TeamMemos from '@/components/team/TeamMemos';
import { Loader2 } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { users, teams, issues, actions, decisions, loading, error, refresh } = usePulseData();

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
        <button onClick={refresh} className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-lg">
          다시 시도
        </button>
      </div>
    );
  }

  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">팀을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <TeamHeader team={team} />
      <IssueTracker issues={issues} teamId={teamId} users={users} onRefresh={refresh} />
      <ActionItemList actions={actions} teamId={teamId} users={users} onRefresh={refresh} />
      <DecisionSection decisions={decisions} teamId={teamId} onRefresh={refresh} />
      <TeamMemos teamId={teamId} />
    </div>
  );
}
