'use client';

import { use } from 'react';
import { usePulseData } from '@/hooks/usePulseData';
import TeamHeader from '@/components/team/TeamHeader';
import DirectionSection from '@/components/team/DirectionSection';
import SystemSection from '@/components/team/SystemSection';
import IssueTracker from '@/components/team/IssueTracker';
import TeamMemos from '@/components/team/TeamMemos';
import { Loader2 } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { users, teams, issues, loading, error, refresh } = usePulseData();

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
    <div>
      <div className="mb-6">
        <TeamHeader team={team} />
      </div>
      <div className="flex gap-6 items-start">
        {/* Left sidebar */}
        <div className="w-80 shrink-0 sticky top-20 space-y-4">
          <DirectionSection teamId={teamId} />
          <SystemSection teamId={teamId} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <IssueTracker issues={issues} teamId={teamId} users={users} onRefresh={refresh} />
          <TeamMemos teamId={teamId} />
        </div>
      </div>
    </div>
  );
}
