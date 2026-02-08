'use client';

import Link from 'next/link';
import { getTeamIssues } from '@/lib/statusCalc';
import type { DbIssue, DbTeam } from '@/types/database';
import { cn } from '@/lib/utils';
import { ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
  team: DbTeam;
  issues: DbIssue[];
}

export default function TeamCard({ team, issues }: Props) {
  const teamIssues = getTeamIssues(issues, team.id);
  const openIssues = teamIssues.filter((i) => i.state !== 'resolved');
  const highIssues = openIssues.filter((i) => i.impact === 'high');

  return (
    <Link href={`/teams/${team.id}`}>
      <div className="group relative bg-white rounded-2xl overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900">{team.name}</h3>
            <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {team.leader_name && (
            <p className="text-sm text-gray-500 mt-0.5">{team.leader_name}</p>
          )}
        </div>

        {/* Issues */}
        <div className="px-5 py-3 space-y-2">
          {openIssues.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">등록된 이슈 없음</p>
          ) : (
            <>
              {openIssues.slice(0, 3).map((issue) => (
                <div key={issue.id} className="flex items-start gap-2">
                  <div className={cn(
                    'mt-1.5 h-2 w-2 rounded-full shrink-0',
                    issue.impact === 'high' ? 'bg-red-400' :
                    issue.impact === 'medium' ? 'bg-amber-400' : 'bg-gray-300'
                  )} />
                  <p className={cn(
                    'text-sm leading-snug line-clamp-1',
                    issue.impact === 'high' ? 'text-gray-800 font-medium' : 'text-gray-600'
                  )}>
                    {issue.title}
                  </p>
                </div>
              ))}
              {openIssues.length > 3 && (
                <p className="text-xs text-gray-400 pl-4">+{openIssues.length - 3}개 더</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>이슈 {openIssues.length}건</span>
            {team.member_count > 0 && <span>{team.member_count}명</span>}
          </div>
          {highIssues.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-3 w-3" />
              긴급 {highIssues.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
