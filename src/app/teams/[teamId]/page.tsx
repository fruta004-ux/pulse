'use client';

import { use } from 'react';
import { usePulseData } from '@/hooks/usePulseData';
import TeamHeader from '@/components/team/TeamHeader';
import IssueTracker from '@/components/team/IssueTracker';
import ActionItemList from '@/components/team/ActionItemList';
import TeamMemos from '@/components/team/TeamMemos';
import UpdateModal from '@/components/update/UpdateModal';
import { Loader2 } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const { users, teams, reports, issues, actions, decisions, loading, error, refresh } = usePulseData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        팀을 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <TeamHeader team={team} />

      {/* 이슈 → 할 일 → 메모 순서 */}
      <IssueTracker issues={issues} teamId={teamId} users={users} onRefresh={refresh} />
      <ActionItemList actions={actions} teamId={teamId} users={users} onRefresh={refresh} />
      <TeamMemos teamId={teamId} />

      <UpdateModal teams={teams} reports={reports} users={users} onSuccess={refresh} />
    </div>
  );
}
