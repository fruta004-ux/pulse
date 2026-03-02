'use client';

import { usePulseData } from '@/hooks/usePulseData';
import OrgCanvas from '@/components/orgchart/OrgCanvas';
import UpdateModal from '@/components/update/UpdateModal';
import { Loader2 } from 'lucide-react';

export default function TeamsPage() {
  const { users, teams, reports, issues, loading, error, refresh } = usePulseData();

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
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">조직도</h1>
        <p className="text-sm text-gray-500 mt-1">팀을 드래그하여 조직도를 구성하세요</p>
      </div>
      <OrgCanvas teams={teams} issues={issues} onPositionChange={refresh} />
      <UpdateModal teams={teams} reports={reports} users={users} onSuccess={refresh} />
    </div>
  );
}
