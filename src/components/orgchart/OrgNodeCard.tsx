'use client';

import Link from 'next/link';
import { getTeamIssues } from '@/lib/statusCalc';
import type { DbIssue, DbTeam } from '@/types/database';
import { cn } from '@/lib/utils';
import { AlertCircle, GripVertical, Users } from 'lucide-react';

interface Props {
  team: DbTeam;
  issues: DbIssue[];
  isDragging?: boolean;
}

export default function OrgNodeCard({ team, issues, isDragging }: Props) {
  const teamIssues = getTeamIssues(issues, team.id);
  const openIssues = teamIssues.filter((i) => i.state !== 'resolved');
  const highIssues = openIssues.filter((i) => i.impact === 'high');

  return (
    <div
      className={cn(
        'w-[220px] bg-white rounded-xl border-2 shadow-md select-none transition-shadow',
        isDragging
          ? 'border-blue-400 shadow-xl shadow-blue-200/50 scale-[1.04]'
          : 'border-gray-200 hover:border-blue-300',
        highIssues.length > 0 && !isDragging && 'border-red-200'
      )}
    >
      {/* Drag handle + header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <Link href={`/teams/${team.id}`} className="block" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm text-gray-900 truncate hover:text-blue-600 transition-colors">
              {team.name}
            </h3>
          </Link>
          {team.leader_name && (
            <p className="text-xs text-gray-500 truncate">{team.leader_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
          <Users className="h-3 w-3" />
          <span>{team.member_count}</span>
        </div>
      </div>

      {/* Issues summary */}
      <div className="px-3 py-2 space-y-1">
        {openIssues.length === 0 ? (
          <p className="text-xs text-gray-400">이슈 없음</p>
        ) : (
          <>
            {openIssues.slice(0, 2).map((issue) => (
              <div key={issue.id} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    issue.impact === 'high'
                      ? 'bg-red-400'
                      : issue.impact === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-gray-300'
                  )}
                />
                <p className="text-xs text-gray-600 truncate">{issue.title}</p>
              </div>
            ))}
            {openIssues.length > 2 && (
              <p className="text-[10px] text-gray-400 pl-3">
                +{openIssues.length - 2}개 더
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer badges */}
      {highIssues.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
            <AlertCircle className="h-2.5 w-2.5" />
            긴급 {highIssues.length}
          </span>
        </div>
      )}
    </div>
  );
}
